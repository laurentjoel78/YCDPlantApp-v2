(async ()=>{
  try {
    const svc = require('./src/services/farmGuidelineService');
    const res = await svc.generateGuidelines('9a588d0e-cf2e-41d2-ba2f-3858477e6f40');
    console.log('RESULT:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
