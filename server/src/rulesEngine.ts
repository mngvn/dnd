export function processAction(action:string, character:any){
  return { result: "ok", detail: `Rule engine processed ${action}` };
}