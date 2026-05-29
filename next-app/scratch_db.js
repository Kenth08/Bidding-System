const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find a supplier user in the database
  const user = await prisma.user.findFirst({
    where: { role: 'supplier' },
    orderBy: { created_at: 'desc' }
  });
  
  if (!user) {
    console.log('No supplier found');
    return;
  }
  
  console.log('Supplier User:', {
    id: user.id,
    email: user.email,
    status: user.status,
    verification_status: user.verification_status,
    sec_dti_certificate: user.sec_dti_certificate,
    mayors_permit: user.mayors_permit,
    philgeps_registration: user.philgeps_registration,
    tax_clearance: user.tax_clearance,
  });

  const uploads = await prisma.documentUpload.findMany({
    where: { user_id: user.id },
    orderBy: { updated_at: 'desc' }
  });
  console.log('\nDocument Uploads:', uploads.map(u => ({
    id: u.id,
    document_type: u.document_type,
    verification_status: u.verification_status,
    verification_notes: u.verification_notes
  })));

  // Query metadata
  const workflow = await prisma.supplierDocumentWorkflow.findFirst({
    where: { user_id: user.id }
  });
  console.log('\nWorkflow:', workflow);
}

main().catch(console.error).finally(() => prisma.$disconnect());
