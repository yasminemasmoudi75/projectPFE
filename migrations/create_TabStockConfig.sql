-- Création de la table TabStockConfig
-- Remplace le fichier backend/data/stockConfig.json

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TabStockConfig' AND xtype='U')
BEGIN
    CREATE TABLE TabStockConfig (
        ID                      INT          PRIMARY KEY DEFAULT 1,
        AutoriserVenteHorsStock BIT          NOT NULL DEFAULT 0,
        StockMinimumAlerte      FLOAT        NOT NULL DEFAULT 5,
        NotificationsRupture    BIT          NOT NULL DEFAULT 1,
        DecrementationBLV       BIT          NOT NULL DEFAULT 1,
        DecrementationFacture   BIT          NOT NULL DEFAULT 1,
        DateMaj                 DATETIME     NOT NULL DEFAULT GETDATE()
    );

    -- Insérer la ligne unique de configuration
    INSERT INTO TabStockConfig (
        ID, AutoriserVenteHorsStock, StockMinimumAlerte,
        NotificationsRupture, DecrementationBLV, DecrementationFacture
    ) VALUES (1, 0, 5, 1, 1, 1);
END
