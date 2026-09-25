/** Runtime feature flags read from the environment (server only). */
export function demoModeEnabled(): boolean {
  return process.env.DEMO_MODE !== "false";
}
