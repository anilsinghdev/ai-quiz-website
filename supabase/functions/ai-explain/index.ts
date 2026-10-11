import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExplainRequest {
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, options, correctAnswer, userAnswer }: ExplainRequest = await req.json();

    if (!question || !options || typeof correctAnswer !== "number") {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service is not configured." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correctOption = options[correctAnswer];
    const userOption = userAnswer !== null ? options[userAnswer] : "No answer selected";

    const prompt = `You are an expert tutor explaining a quiz answer to a student.

Question: ${question}
Options:
A. ${options[0]}
B. ${options[1]}
C. ${options[2]}
D. ${options[3]}

Correct answer: ${String.fromCharCode(65 + correctAnswer)}. ${correctOption}
Student's answer: ${userAnswer !== null ? `${String.fromCharCode(65 + userAnswer)}. ${userOption}` : "No answer selected"}

Please explain:
1. Why the correct answer ("${correctOption}") is correct — be specific and clear.
2. Why the student's answer ("${userOption}") is wrong — explain the misconception.
3. A simple, easy-to-remember example to reinforce the concept.
4. A short learning tip (one sentence) to help them remember this in the future.

Format your response as plain text with clear section headers:
**Why the correct answer is right:**
[explanation]

**Why your answer is wrong:**
[explanation]

**Example:**
[simple example]

**Learning Tip:**
[one-sentence tip]`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful, encouraging tutor. Explain concepts clearly and simply." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      console.error("OpenAI API error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI explanation failed. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const explanation = aiData.choices?.[0]?.message?.content;

    if (!explanation) {
      return new Response(JSON.stringify({ error: "AI returned no explanation." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
