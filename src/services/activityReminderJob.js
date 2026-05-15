const schedule = require('node-schedule');
const { sequelize, Notification } = require('../models');
const { QueryTypes } = require('sequelize');

const REMINDER_MINUTES = 30;

const checkActivityReminders = async () => {
  try {
    // 1. Activités qui commencent dans les 30 prochaines minutes (rappel)
    const upcoming = await sequelize.query(`
      SELECT a.Guid, a.LibProj AS Type_Activite, a.Mdate AS Date_Activite,
             a.[User] AS UserId, t.Raisoc
      FROM TabActivite a
      LEFT JOIN TabTiers t ON a.CodTiers = t.CodTiers
      WHERE a.Valide = 0
        AND ISNULL(a.categ, '') NOT IN ('Terminé', 'Annulé', 'Reporté')
        AND TRY_CONVERT(DATETIME, a.Mdate) >= GETDATE()
        AND TRY_CONVERT(DATETIME, a.Mdate) <= DATEADD(MINUTE, :minutes, GETDATE())
        AND a.[User] IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM UCS_NOTIFICATIONS n
          WHERE n.Type = 'ACTIVITY_REMINDER'
            AND n.RecipientID = a.[User]
            AND n.Message LIKE CONCAT('%', CAST(a.Guid AS NVARCHAR(50)), '%')
            AND n.CreatedAt >= DATEADD(HOUR, -1, GETDATE())
        )
    `, { replacements: { minutes: REMINDER_MINUTES }, type: QueryTypes.SELECT });

    for (const act of upcoming) {
      await Notification.create({
        RecipientID: act.UserId,
        Title: `Rappel : ${act.Type_Activite}${act.Raisoc ? ' — ' + act.Raisoc : ''} dans ${REMINDER_MINUTES} min`,
        Message: JSON.stringify({
          _type: 'ACTIVITY_REMINDER',
          activityGuid: act.Guid,
          type: act.Type_Activite,
          client: act.Raisoc || null,
          date: act.Date_Activite
        }),
        Type: 'ACTIVITY_REMINDER',
        IsRead: false
      });
    }

    // 2. Activités dont la date est dépassée et non validées (retard)
    const overdue = await sequelize.query(`
      SELECT a.Guid, a.LibProj AS Type_Activite, a.Mdate AS Date_Activite,
             a.[User] AS UserId, t.Raisoc
      FROM TabActivite a
      LEFT JOIN TabTiers t ON a.CodTiers = t.CodTiers
      WHERE a.Valide = 0
        AND ISNULL(a.categ, '') NOT IN ('Terminé', 'Annulé', 'Reporté')
        AND TRY_CONVERT(DATETIME, a.Mdate) < GETDATE()
        AND a.[User] IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM UCS_NOTIFICATIONS n
          WHERE n.Type = 'ACTIVITY_OVERDUE'
            AND n.RecipientID = a.[User]
            AND n.Message LIKE CONCAT('%', CAST(a.Guid AS NVARCHAR(50)), '%')
            AND n.CreatedAt >= DATEADD(HOUR, -24, GETDATE())
        )
    `, { type: QueryTypes.SELECT });

    for (const act of overdue) {
      await Notification.create({
        RecipientID: act.UserId,
        Title: `Activité non réalisée : ${act.Type_Activite}${act.Raisoc ? ' — ' + act.Raisoc : ''}`,
        Message: JSON.stringify({
          _type: 'ACTIVITY_OVERDUE',
          activityGuid: act.Guid,
          type: act.Type_Activite,
          client: act.Raisoc || null,
          date: act.Date_Activite
        }),
        Type: 'ACTIVITY_OVERDUE',
        IsRead: false
      });
    }

    if (upcoming.length > 0 || overdue.length > 0) {
      console.log(`🔔 [ActivityReminder] ${upcoming.length} rappel(s), ${overdue.length} retard(s) envoyés`);
    }
  } catch (err) {
    console.error('❌ [ActivityReminder] Erreur:', err.message);
  }
};

const startActivityReminderJob = () => {
  schedule.scheduleJob('*/5 * * * *', checkActivityReminders);
  checkActivityReminders();
  console.log('✅ [ActivityReminder] Job démarré (toutes les 5 minutes)\n');
};

module.exports = { startActivityReminderJob };
