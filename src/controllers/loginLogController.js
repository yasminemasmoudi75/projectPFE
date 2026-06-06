const { LoginLog, sequelize } = require('../models');
const { Op } = require('sequelize');

// Convertit une JS Date en numéro série Excel (format utilisé par UCS_LOGIN_TRACE)
const toExcelSerial = (d) => (d.getTime() / 86400000) + 25569;

exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId, search, dateFrom, dateTo } = req.query;
    const lim    = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * lim;

    const conditions   = ['1=1'];
    const replacements = {};
    const dateRegex    = /^\d{4}-\d{2}-\d{2}$/;

    if (action && action !== 'ALL') {
      conditions.push('Action = :action');
      replacements.action = action;
    }
    if (userId) {
      conditions.push('ID_Utilisateur = :userId');
      replacements.userId = parseInt(userId, 10);
    }
    if (search) {
      conditions.push('(LoginName LIKE :search OR FullName LIKE :search OR IPAddress LIKE :search)');
      replacements.search = `%${search}%`;
    }
    // Dates : format YYYYMMDD non-ambigu en MSSQL, validé par regex
    if (dateFrom && dateRegex.test(dateFrom)) {
      conditions.push(`DateConnexion >= '${dateFrom.replace(/-/g, '')}'`);
    }
    if (dateTo && dateRegex.test(dateTo)) {
      conditions.push(`DateConnexion < DATEADD(day, 1, CAST('${dateTo.replace(/-/g, '')}' AS DATE))`);
    }

    const whereClause = conditions.join(' AND ');

    const [[{ total }]] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM UCS_LOGIN_LOGS WHERE ${whereClause}`,
      { replacements }
    );

    const [rows] = await sequelize.query(
      `SELECT ID_Log, ID_Utilisateur, LoginName, FullName, Role, Action, IPAddress, Details, DateConnexion
       FROM UCS_LOGIN_LOGS
       WHERE ${whereClause}
       ORDER BY DateConnexion DESC
       OFFSET ${offset} ROWS FETCH NEXT ${lim} ROWS ONLY`,
      { replacements }
    );

    const [[statsRow]] = await sequelize.query(`
      SELECT
        SUM(CASE WHEN Action = 'LOGIN_SUCCESS' THEN 1 ELSE 0 END) AS successToday,
        SUM(CASE WHEN Action = 'LOGIN_FAILED'  THEN 1 ELSE 0 END) AS failedToday,
        SUM(CASE WHEN Action = 'LOGOUT'        THEN 1 ELSE 0 END) AS logoutToday,
        COUNT(*) AS totalToday
      FROM UCS_LOGIN_LOGS
      WHERE DateConnexion >= DATEADD(hour, -24, GETDATE())
    `);

    res.status(200).json({
      status: 'success',
      count: total,
      totalPages: Math.ceil(total / lim),
      currentPage: parseInt(page, 10),
      data: rows,
      stats: statsRow
    });
  } catch (error) {
    console.error('❌ Erreur getLogs:', error);
    next(error);
  }
};

exports.getTraceLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', dateFrom = '', dateTo = '' } = req.query;
    const lim  = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * lim;

    const dateConvert = `CONVERT(DATETIME, DATEADD(day, CAST(t.LOGIN_DATE_TIME AS INT) - 2, '1900-01-01') + CAST(t.LOGIN_DATE_TIME - FLOOR(t.LOGIN_DATE_TIME) AS FLOAT))`;
    const logoutConvert = `CASE WHEN t.LOGOUT_DATE_TIME > 0 THEN CONVERT(DATETIME, DATEADD(day, CAST(t.LOGOUT_DATE_TIME AS INT) - 2, '1900-01-01') + CAST(t.LOGOUT_DATE_TIME - FLOOR(t.LOGOUT_DATE_TIME) AS FLOAT)) ELSE NULL END`;

    const conditions = ['1=1'];
    const replacements = {};

    if (search) {
      conditions.push(`(u.USER_NAME LIKE :search OR u.REAL_NAME LIKE :search OR t.COMPUTER_NAME LIKE :search)`);
      replacements.search = `%${search}%`;
    }
    if (dateFrom) {
      replacements.dateFrom = toExcelSerial(new Date(dateFrom));
      conditions.push(`t.LOGIN_DATE_TIME >= :dateFrom`);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      replacements.dateTo = toExcelSerial(end);
      conditions.push(`t.LOGIN_DATE_TIME <= :dateTo`);
    }

    const where = conditions.join(' AND ');

    const [[{ total }]] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM UCS_LOGIN_TRACE t LEFT JOIN UCS_USERS u ON CAST(t.USER_ID AS INT) = CAST(u.USER_ID AS INT) WHERE ${where}`,
      { replacements }
    );

    const [rows] = await sequelize.query(
      `SELECT t.APP_ID, CAST(t.USER_ID AS INT) AS USER_ID, t.COMPUTER_NAME,
              ${dateConvert}  AS LoginDate,
              ${logoutConvert} AS LogoutDate,
              u.USER_NAME, u.REAL_NAME
       FROM UCS_LOGIN_TRACE t
       LEFT JOIN UCS_USERS u ON CAST(t.USER_ID AS INT) = CAST(u.USER_ID AS INT)
       WHERE ${where}
       ORDER BY t.LOGIN_DATE_TIME DESC
       OFFSET ${offset} ROWS FETCH NEXT ${lim} ROWS ONLY`,
      { replacements }
    );

    // Stats du jour
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todaySerial = toExcelSerial(todayStart);
    const [[statsRow]] = await sequelize.query(
      `SELECT
        COUNT(*) AS totalToday,
        COALESCE(SUM(CASE WHEN LOGOUT_DATE_TIME > 0 THEN 1 ELSE 0 END), 0) AS logoutToday,
        COALESCE(SUM(CASE WHEN LOGOUT_DATE_TIME <= 0 THEN 1 ELSE 0 END), 0) AS activeNow,
        COUNT(DISTINCT CAST(USER_ID AS INT)) AS uniqueUsers
       FROM UCS_LOGIN_TRACE WHERE LOGIN_DATE_TIME >= :todaySerial`,
      { replacements: { todaySerial } }
    );

    res.status(200).json({
      status: 'success',
      count: total,
      totalPages: Math.ceil(total / lim),
      currentPage: parseInt(page, 10),
      data: rows,
      stats: statsRow
    });
  } catch (error) {
    console.error('❌ Erreur getTraceLogs:', error);
    next(error);
  }
};

exports.clearOldLogs = async (req, res, next) => {
  try {
    const daysToKeep = parseInt(req.query.days || '90', 10);
    const cutoff = sequelize.literal(`DATEADD(day, -${daysToKeep}, GETDATE())`);
    const deleted = await LoginLog.destroy({ where: { DateConnexion: { [Op.lt]: cutoff } } });
    res.status(200).json({ status: 'success', message: `${deleted} entrées supprimées (plus de ${daysToKeep} jours)` });
  } catch (error) {
    next(error);
  }
};
