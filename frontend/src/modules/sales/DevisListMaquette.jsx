import SalesListMaquette from './SalesListMaquette';
import { MODULE_CODES } from '../../utils/constants';

const DevisListMaquette = () => {
    const getStatusBadge = (devis) => {
        if (devis.bTransf || devis.Btransf) {
            return <span className="table-cell-status status-validated">Transformé</span>;
        }
        if (devis.Valid) {
            return <span className="table-cell-status status-validated">Validé</span>;
        }
        return <span className="table-cell-status status-draft">Brouillon</span>;
    };

    return (
        <SalesListMaquette
            moduleCode={MODULE_CODES.DEVIS}
            endpoint="/devis"
            title="Devis"
            documentType="devis"
            columns={[
                { key: 'Num', label: 'Référence', type: 'reference' },
                { key: 'DatDoc', label: 'Date', type: 'date' },
                { key: 'client', label: 'Client', type: 'client', subField: 'CodTiers' },
                { key: 'TotHT', label: 'Total HT', type: 'amount' },
                { key: 'TotTTC', label: 'Total TTC', type: 'amount' },
                { key: 'status', label: 'Statut', type: 'status' }
            ]}
            filters={[
                { key: 'client', label: 'Tous les clients', optionsKey: 'clients', width: '180px' },
                { key: 'commercial', label: 'Tous les commerciaux', optionsKey: 'commercials', width: '180px' },
                { 
                    key: 'status', 
                    label: 'Tous les statuts', 
                    width: '140px',
                    options: [
                        { value: 'draft', label: 'Brouillon' },
                        { value: 'valid', label: 'Validé' },
                        { value: 'converted', label: 'Transformé' }
                    ]
                }
            ]}
            getStatusBadge={getStatusBadge}
        />
    );
};

export default DevisListMaquette;
