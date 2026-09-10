import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql, ensureSchema } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { calcTargets, sumMacros, todayISO } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const SYSTEM_INSTRUCTIONS = `You are NutriBot, a friendly, knowledgeable AI nutrition coach inside the NutriTrack AI app.
You help the user with nutrition advice, recipes, meal ideas, and fitness questions across global and Indian cuisines.
You can also log food to their diary when they tell you what they ate.

Context about the user and their day so far will be provided before their message. Use it to personalize your answers
(e.g. remaining calories, macro gaps, whether they're close to their water goal).

IMPORTANT — logging food:
If (and only if) the user's message describes something they ate or want logged (e.g. "I had 2 rotis and dal tadka for lunch",
"log 500ml water", "add a banana to my snacks"), estimate reasonable nutrition values and respond with a short friendly
confirmation sentence, followed on a new line by a fenced JSON block in EXACTLY this shape (no extra commentary inside it):

\`\`\`json
{"action":"log_food","meal":"breakfast|lunch|dinner|snacks","items":[{"food_name":"...","portion":"...","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0}]}
\`\`\`

For logging water, use this shape instead:

\`\`\`json
{"action":"log_water","amount_ml":250}
\`\`\`

If the user is just asking a question (not logging anything), do NOT include any JSON block — just answer normally in plain,
warm, concise text with occasional emoji. Never include a JSON block unless the user clearly wants something logged.`;

function extractActionBlock(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (!match) return { cleanText: text.trim(), action: null };

  let action = null;
  try {
    action = JSON.parse(match[1].trim());
  } catch (e) {
    action = null;
  }

  const cleanText = text.replace(match[0], "").trim();
  return { cleanText, action };
}

export async function GET() {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const result = await sql`
    SELECT role, content, created_at FROM chat_messages
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 100
  `;
  return NextResponse.json({ messages: result.rows });
}

export async function DELETE() {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await sql`DELETE FROM chat_messages WHERE user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}

export async function POST(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const { message } = await request.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const date = todayISO();

  // Build context: user profile + today's totals
  const userRows = await sql`SELECT * FROM users WHERE id = ${userId}`;
  const user = userRows.rows[0];
  const targets = calcTargets(user);

  const foodRows = await sql`
    SELECT calories, protein_g, carbs_g, fat_g, fiber_g FROM food_logs
    WHERE user_id = ${userId} AND log_date = ${date}
  `;
  const eaten = sumMacros(foodRows.rows);

  const waterRows = await sql`
    SELECT COALESCE(SUM(amount_ml),0) as total_ml FROM water_logs
    WHERE user_id = ${userId} AND log_date = ${date}
  `;
  const waterMl = Number(waterRows.rows[0].total_ml);

  const contextBlock = `Today's status for ${user.name}:
- Calories eaten: ${eaten.calories} / ${targets.targetCalories} kcal target (${Math.max(0, targets.targetCalories - eaten.calories)} kcal remaining)
- Protein: ${eaten.protein_g}g / ${targets.proteinG}g
- Carbs: ${eaten.carbs_g}g / ${targets.carbsG}g
- Fat: ${eaten.fat_g}g / ${targets.fatG}g
- Fiber: ${eaten.fiber_g}g / ${targets.fiberG}g
- Water: ${waterMl}ml / ${targets.waterTargetMl}ml
- Goal: ${user.goal}, activity level: ${user.activity_level}`;

  // Recent chat history for continuity
  const historyRows = await sql`
    SELECT role, content FROM chat_messages
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 12
  `;
  const history = historyRows.rows.reverse();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTIONS,
  });

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
  });

  let replyText;
  try {
    const result = await chat.sendMessage(`${contextBlock}\n\nUser message: ${message}`);
    replyText = result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "The AI service is unavailable right now." }, { status: 502 });
  }

  const { cleanText, action } = extractActionBlock(replyText);
  let loggedItems = [];

  if (action?.action === "log_food" && Array.isArray(action.items)) {
    const meal = ["breakfast", "lunch", "dinner", "snacks"].includes(action.meal) ? action.meal : "snacks";
    for (const item of action.items) {
      const inserted = await sql`
        INSERT INTO food_logs (user_id, log_date, meal, food_name, portion, calories, protein_g, carbs_g, fat_g, fiber_g)
        VALUES (
          ${userId}, ${date}, ${meal},
          ${item.food_name || "Food item"}, ${item.portion || ""},
          ${item.calories || 0}, ${item.protein_g || 0}, ${item.carbs_g || 0}, ${item.fat_g || 0}, ${item.fiber_g || 0}
        )
        RETURNING id, meal, food_name, portion, calories, protein_g, carbs_g, fat_g, fiber_g;
      `;
      loggedItems.push(inserted.rows[0]);
    }
  } else if (action?.action === "log_water" && action.amount_ml) {
    await sql`INSERT INTO water_logs (user_id, log_date, amount_ml) VALUES (${userId}, ${date}, ${action.amount_ml})`;
  }

  await sql`INSERT INTO chat_messages (user_id, role, content) VALUES (${userId}, 'user', ${message})`;
  await sql`INSERT INTO chat_messages (user_id, role, content) VALUES (${userId}, 'assistant', ${cleanText})`;

  return NextResponse.json({ reply: cleanText, action, loggedItems });
}
