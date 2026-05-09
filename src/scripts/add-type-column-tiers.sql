ALTER TABLE TabTiers ADD Type NVARCHAR(50) NULL;
GO
UPDATE TabTiers SET Type = 'Client Professionnel' WHERE Type IS NULL;
GO
