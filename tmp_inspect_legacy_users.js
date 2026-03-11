const { User } = require('./src/models');

(async () => {
  try {
    const users = await User.findAll({
      where: { UserID: null }
    });

    const summary = users.map((user) => ({
      email: user.EmailPro,
      fullName: user.FullName,
      userId: user.UserID,
      passwordPreview: typeof user.Password === 'string' ? user.Password.slice(0, 12) : null,
      passwordLength: typeof user.Password === 'string' ? user.Password.length : null,
      guid: user.GUID
    }));

    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

