const res = await fetch(
  "https://peswoagwacbewbahpbgq.supabase.co/functions/v1/send-whatsapp",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      to: "923329984490",
      message: "Welcome to Sociapi Society!",
    }),
  }
);

const data = await res.json();
console.log(data);