import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** vitest（node/jsdom）用的 msw server，瀏覽器端請用 browser.ts */
export const server = setupServer(...handlers);
