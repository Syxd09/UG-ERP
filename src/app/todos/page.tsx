import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-cyan-400">Supabase Connection Test</h1>
          <p className="text-xs text-slate-400 mt-1">
            Endpoint: <code className="text-cyan-300">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            <p className="font-semibold">Supabase Query Note:</p>
            <p className="text-xs text-amber-400 mt-1">{error.message}</p>
            <p className="text-xs text-slate-400 mt-2">
              (Create a table named <code className="bg-slate-800 px-1 py-0.5 rounded">todos</code> in your Supabase project table editor to see rows populate here).
            </p>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Todos Table Items:</h2>
          {todos && todos.length > 0 ? (
            <ul className="space-y-2">
              {todos.map((todo: any) => (
                <li key={todo.id} className="p-2.5 rounded bg-slate-800/60 border border-slate-700/50 text-sm">
                  {todo.name || JSON.stringify(todo)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No items found in 'todos' table yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

