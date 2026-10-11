import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AttemptData {
  quiz_title: string;
  category_name: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  difficulty: string;
  completed_at: string;
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

    const { attempts }: { attempts: AttemptData[] } = await req.json();

    if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
      return new Response(JSON.stringify({ error: "No quiz data provided." }), {
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

    const quizData = attempts.map((a) => ({
      quiz: a.quiz_title,
      category: a.category_name,
      score: a.score,
      correct: a.correct_answers,
      total: a.total_questions,
      difficulty: a.difficulty,
      date: a.completed_at.split("T")[0],
    }));

    const avgScore = Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
    const totalQuizzes = attempts.length;

    const prompt = `You are an expert learning analyst. Analyze this student's quiz performance data and provide personalized insights.

Student Performance Summary:
- Total quizzes taken: ${totalQuizzes}
- Average score: ${avgScore}%

Detailed quiz data:
${JSON.stringify(quizData, null, 2)}

Please analyze the student's performance and provide a response in this EXACT format (plain text, no JSON):

**Strengths**
List 2-3 specific areas where the student is performing well, with brief reasoning.

**Weak Topics**
List 2-3 topics or categories where the student is struggling, with brief reasoning.

**Recommended Topics**
Suggest 2-3 specific topics they should study next based on their performance pattern.

**Suggested Quizzes**
Suggest 2-3 specific quiz topics or areas to practice, explaining why each would help them improve.

Be specific, encouraging, and reference their actual scores and categories where possible.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a supportive learning analyst who gives specific, actionable advice based on data." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      }),
    });

    if (!aiResponse.ok) {
      console.error("OpenAI API error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI analysis failed. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content;

    if (!analysis) {
      return new Response(JSON.stringify({ error: "AI returned no analysis." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
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
