import SalesListMaquette from './SalesListMaquette';
import { MODULE_CODES } from '../../utils/constants';

const FavListMaquette = () => {
    const getStatusBadge = (fav) => {
        // Check if paid based on your app's logic
        if (fav.Paye || fav.MontantPaye >= fav.TotTTC) {
            return <span className="table-cell-status status-validated">Payée</span>;
        }
        if (fav.MontantPaye > 0) {
            return <span className="table-cell-status status-draft">Partiellement payée</span>;
        }
        return <span className="table-cell-status status-pending">Non payée</span>;
    };

    return (
        <SalesListMaquette
            moduleCode={MODULE_CODES.FACTURES}
            endpoint="/fav"
            title="Factures"
            documentType="fav"
            columns={[
                { key: 'Num', label: 'Référence', type: 'reference' },
                { key: 'DatDoc', label: 'Date', type: 'date' },
                { key: 'client', label: 'Client', type: 'client', subField: 'CodTiers' },
                { key: 'TotTTC', label: 'Total TTC', type: 'amount' },
                { key: 'status', label: 'Statut Paiement', type: 'status' },
                { key: 'SourceBlv', label: 'Source BL', type: 'text' }
            ]}
            filters={[
                { key: 'client', label: 'Tous les clients', optionsKey: 'clients', width: '180px' },
                { 
                    key: 'status', 
                    label: 'Tous les statuts', 
                    width: '140px',
                    options: [
                        { value: 'paid', label: 'Payée' },
                        { value: 'unpaid', label: 'Non payée' },
                        { value: 'partial', label: 'Partiellement payée' }
                    ]
                }
            ]}
            getStatusBadge={getStatusBadge}
        />
    );
};

export default FavListMaquette;
