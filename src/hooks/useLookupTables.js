import { useState, useEffect } from 'react';
import axiosInstance from '../app/axios';

/**
 * Custom hook pour récupérer les tables de lookup
 * Retourne tiersClasses, tiersGouvernorats, tiersCategories, et l'état loading
 * 
 * Usage:
 * const { tiersClasses, tiersGouvernorats, tiersCategories, loading } = useLookupTables();
 */
export const useLookupTables = () => {
    const [tiersClasses, setTiersClasses] = useState([]);
    const [tiersGouvernorats, setTiersGouvernorats] = useState([]);
    const [tiersCategories, setTiersCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllLookups = async () => {
            try {
                setLoading(true);
                
                // Fetch les 3 tables en parallèle
                const [classesRes, gouvernoratsRes, categoriesRes] = await Promise.all([
                    axiosInstance.get('/tiers-classes'),
                    axiosInstance.get('/tiers-gouvernorats'),
                    axiosInstance.get('/tiers-categories')
                ]);

                // Gérer différents formats de réponse
                setTiersClasses(classesRes.data?.data || classesRes.data || []);
                setTiersGouvernorats(gouvernoratsRes.data?.data || gouvernoratsRes.data || []);
                setTiersCategories(categoriesRes.data?.data || categoriesRes.data || []);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching lookup tables:', err);
                setError(err.message);
                setTiersClasses([]);
                setTiersGouvernorats([]);
                setTiersCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllLookups();
    }, []);

    return {
        tiersClasses,
        tiersGouvernorats,
        tiersCategories,
        loading,
        error
    };
};

export default useLookupTables;
