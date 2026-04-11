SELECT TOP 1 UserID, LoginName, EmailPro, UserRole
FROM Sec_Users
WHERE LOWER(ISNULL(EmailPro,''))='com@gmail.com' OR LOWER(ISNULL(LoginName,''))='com@gmail.com';

SELECT TOP 20 CodTiers, Raisoc, codRepresTiers
FROM TabTiers
WHERE LOWER(ISNULL(Raisoc,'')) LIKE '%yasmine%';

SELECT TOP 30 Nf, CodTiers, LibTiers, CodRepres, DatUser
FROM TabBcvm
WHERE LOWER(ISNULL(LibTiers,'')) LIKE '%yasmine%'
ORDER BY DatUser DESC;

SELECT COUNT(*) AS BcvByUserIdOnly
FROM TabBcvm
WHERE CodTiers IN (
  SELECT CodTiers
  FROM TabTiers
  WHERE CONVERT(VARCHAR(100), codRepresTiers) IN (
    SELECT CONVERT(VARCHAR(100), UserID)
    FROM Sec_Users
    WHERE LOWER(ISNULL(EmailPro,''))='com@gmail.com' OR LOWER(ISNULL(LoginName,''))='com@gmail.com'
  )
);
