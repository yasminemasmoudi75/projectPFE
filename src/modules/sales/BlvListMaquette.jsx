import SalesListMaquette from './SalesListMaquette';
import { MODULE_CODES } from '../../utils/constants';

const BlvListMaquette = () => {
    const getStatusBadge = (blv) => {
        if (blv.Valid) {
            return <span className="table-cell-status status-validated">Livré</span>;
        }
        return <span className="table-cell-status status-pending">En cours</span>;
    };

    return (
        <SalesListMaquette
            moduleCode={MODULE_CODES.LIVRAISONS}
            endpoint="/blv"
            title="Bons de Livraison"
            documentType="blv"
            columns={[
                { key: 'Num', label: 'Référence', type: 'reference' },
                { key: 'DatDoc', label: 'Date', type: 'date' },
                { key: 'client', label: 'Client', type: 'client', subField: 'CodTiers' },
                { key: 'DesChauff', label: 'Chauffeur', type: 'text' },
                { key: 'Vehicule', label: 'Véhicule', type: 'text' },
                { key: 'status', label: 'Statut', type: 'status' }
            ]}
            filters={[
                { key: 'client', label: 'Tous les clients', optionsKey: 'clients', width: '180px' },
                { 
                    key: 'status', 
                    label: 'Tous les statuts', 
                    width: '140px',
                    options: [
                        { value: 'delivered', label: 'Livré' },
                        { value: 'pending', label: 'En cours' },
                        { value: 'returned', label: 'Retourné' }
                    ]
                }
            ]}
            getStatusBadge={getStatusBadge}
        />
    );
};

export default BlvListMaquette;
