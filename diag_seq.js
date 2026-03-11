try {
    console.log('1. Loading Category...');
    require('./src/models/Category');
    console.log('2. Loading Collection...');
    require('./src/models/Collection');
    console.log('3. Loading DevisMaster...');
    require('./src/models/DevisMaster');
    console.log('✅ Success!');
} catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err.stack);
}
