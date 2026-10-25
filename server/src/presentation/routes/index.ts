import { createAuthRouter } from "./auth.routes.js";

export const routes = {
  auth: createAuthRouter,
};

export default routes;
