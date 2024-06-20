import { initProject } from "../util/init.js";
import { log } from "../util/log.js";

export const initCommand = async () => {
  try {
    await initProject();
    log.success("Project initialized successfully! 🎉✨");
  } catch (error) {
    log.error("\n ❌ INITIALIZATION FAILED...\n" + error.message);
  }
};
