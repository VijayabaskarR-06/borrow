export const dynamic='force-dynamic';
export function GET(){return Response.json({status:'ok',application:'BORROW',version:'1.0.0',processor:process.env.OPENAI_API_KEY?'ai-assisted':'local-reconciliation',authentication:'email-password-and-isolated-guest'},{headers:{'Cache-Control':'no-store'}})}
