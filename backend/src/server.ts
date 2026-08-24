import app from "./app";
import { PORT } from "./config";

app.listen(PORT, () => {
  console.info(`> Listening on port ${PORT}`);
});
