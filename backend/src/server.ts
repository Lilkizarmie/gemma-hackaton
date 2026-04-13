import app from "./app";

const port = Number(process.env.PORT ?? 5050);

app.listen(port, () => {
  console.log(`RootRise hackathon backend listening on port ${port}`);
});

