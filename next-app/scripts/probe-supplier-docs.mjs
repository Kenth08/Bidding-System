async function main(){
  const login = await fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'supplier@gmail.com',password:'supplier123'})});
  console.log('login',login.status);
  const cookie=(login.headers.getSetCookie?.()||[]).map(v=>String(v).split(';')[0]).join('; ');
  const docsRes = await fetch('http://localhost:3000/api/auth/supplier-documents',{headers:{cookie}});
  console.log('docs',docsRes.status);
  const data = await docsRes.json();
  const docs = data.documents||[];
  console.log('status',data.accountStatus,'access',data.accessState,'canSubmit',data.canSubmitRevision);
  console.log('flagged required',docs.filter(d=>d.required && d.state==='flagged').map(d=>({id:d.id,state:d.state,status:d.status,reason:d.flagReason,uploaded:d.uploaded})));
  console.log('first few',docs.slice(0,5).map(d=>({id:d.id,state:d.state,status:d.status,uploaded:d.uploaded,reason:d.flagReason||d.adminComment})));
}
main().catch(e=>{console.error(e); process.exit(1);});
