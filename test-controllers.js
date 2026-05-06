const { sequelize, User, Objectif } = require('./src/models');
const { getAssignableCommercials } = require('./src/controllers/userController');
const { getAllObjectifs } = require('./src/controllers/objectifController');

async function run() {
  const adminReq = {
    user: { UserRole: 'admin', UserID: 7 },
    query: { moduleCode: '42', includeAll: 'true' }, // Objectifs module is 42? Wait, the route says checkPermission(MODULES.OBJECTIFS, 'read'), which is 42
    permissions: { FiltreRepres: 0 }
  };
  
  const adminRes = {
    status: (code) => ({
      json: (data) => console.log('Admin getAssignableCommercials:', data.data?.length)
    })
  };
  
  await getAssignableCommercials(adminReq, adminRes, (err) => console.error(err));
  
  const objReq = {
    user: { UserRole: 'admin', UserID: 7 },
    query: { annee: '2026' },
    permissions: { FiltreRepres: 0 }
  };
  const objRes = {
    status: (code) => ({
      json: (data) => console.log('Admin getAllObjectifs count:', data.count, data.data?.length)
    })
  };
  await getAllObjectifs(objReq, objRes, (err) => console.error(err));
  process.exit();
}
run();
