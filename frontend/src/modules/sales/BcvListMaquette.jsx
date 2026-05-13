import SalesListMaquette from './SalesListMaquette';
import { MODULE_CODES } from '../../utils/constants';

const BcvListMaquette = () => {
    const getStatusBadge = (bcv) => {
        if (bcv.bTransf || bcv.Btransf) {
            return <span className="table-cell-status status-validated">À livrer</span>;
        }
        if (bcv.Valid) {
            return <span className="table-cell-status status-validated">Validé</span>;
        }
        return <span className="table-cell-status status-pending">En attente</span>;
    };

    return (
        <SalesListMaquette
            moduleCode={MODULE_CODES.COMMANDES}
            endpoint="/bcv"
            title="Bons de Commande"
            documentType="bcv"
            columns={[
                { key: 'Num', label: 'Référence', type: 'reference' },
                { key: 'DatDoc', label: 'Date', type: 'date' },
                { key: 'client', label: 'Client', type: 'client', subField: 'CodTiers' },
                { key: 'TotTTC', label: 'Total TTC', type: 'amount' },
                { key: 'status', label: 'Statut', type: 'status' },
                { key: 'Source', label: 'Source', type: 'text' }
            ]}
            filters={[
                { key: 'client', label: 'Tous les clients', optionsKey: 'clients', width: '180px' },
                { 
                    key: 'status', 
                    label: 'Tous les statuts', 
                    width: '140px',
                    options: [
                        { value: 'validated', label: 'Validé' },
                        { value: 'pending', label: 'En attente' },
                        { value: 'delivered', label: 'À livrer' }
                    ]
                }
            ]}
            getStatusBadge={getStatusBadge}
            canTransfer={true}
        />
    );
};

export default BcvListMaquette;
