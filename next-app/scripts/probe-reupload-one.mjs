async function main(){
  const login = await fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'supplier@gmail.com',password:'supplier123'})});
  const cookie=(login.headers.getSetCookie?.()||[]).map(v=>String(v).split(';')[0]).join('; ');
  console.log('login',login.status);
  const form = new FormData();
  form.append('file', new Blob(['dummy'], {type:'application/pdf'}), 'sec_dti_certificate.pdf');
  const up = await fetch('http://localhost:3000/api/supplier/documents/sec_dti_certificate/reupload',{method:'POST',headers:{cookie},body:form});
  console.log('reupload status',up.status);
  console.log(await up.text());
}
main().catch(e=>{console.error(e); process.exit(1);});
