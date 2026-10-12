import { AuthRouter } from "./auth.routes.js";
import {ClinicRouter} from "./clinic.routes.js";
// import {invitationRouter} from "./invitation.routes.js";
import {DoctorRouter} from "./doctor.routes.js";

export const routes = {
  auth: AuthRouter,
  clinic: ClinicRouter,
  // invitation: invitationRouter,
  doctor: DoctorRouter,
};

export default routes;
