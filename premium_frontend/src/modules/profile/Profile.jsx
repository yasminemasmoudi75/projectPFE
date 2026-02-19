import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import authService from '../../auth/authService';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useAuth(); // login is used to update the user in context/storage
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    FullName: '',
    EmailPro: '',
    TelPro: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        FullName: user.FullName || '',
        EmailPro: user.EmailPro || '',
        TelPro: user.TelPro || '',
      });
      // Set preview to current profile picture
      if (user.PhotoProfil) {
        setPreviewUrl(user.PhotoProfil); // Use relative path, Vite proxy will handle it
      }
    }
  }, [user]);

  const handleInfoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('FullName', formData.FullName);
      formDataToSend.append('EmailPro', formData.EmailPro);
      formDataToSend.append('TelPro', formData.TelPro);

      if (selectedFile) {
        formDataToSend.append('profilePicture', selectedFile);
      }

      await authService.updateProfile(formDataToSend);

      toast.success('Profil mis à jour avec succès');

      // Force reload to get fresh data
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Les nouveaux mots de passe ne correspondent pas');
    }

    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Mon Compte</h1>
        <p className="mt-2 text-slate-500">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-luxury p-0 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            <div className="px-8 pb-8 -mt-16 text-center">
              <div className="relative inline-block">
                <input
                  type="file"
                  id="profilePictureInput"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="profilePictureInput"
                  className="cursor-pointer block h-32 w-32 rounded-3xl bg-white p-2 shadow-soft-xl mx-auto mb-6 transform hover:scale-105 transition-transform duration-300 group"
                >
                  <div className="h-full w-full rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-4xl font-bold text-blue-600 overflow-hidden relative">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      user?.FullName?.charAt(0) || 'U'
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </label>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{user?.FullName}</h2>
              <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100 mb-6">
                {user?.UserRole || 'Utilisateur'}
              </span>

              {selectedFile && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Photo sélectionnée ! Cliquez sur "Enregistrer" dans l'onglet Informations
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-between group ${activeTab === 'info'
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeTab === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-500'} transition-colors`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                    Informations
                  </span>
                  {activeTab === 'info' && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-between group ${activeTab === 'security'
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeTab === 'security' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-500'} transition-colors`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                    Sécurité
                  </span>
                  {activeTab === 'security' && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'info' && (
            <div className="card-luxury animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Informations Personnelles</h2>
                  <p className="text-sm text-slate-500">Mettez à jour vos coordonnées</p>
                </div>
              </div>

              <form onSubmit={onUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="label-modern">Nom Complet / Raison Sociale</label>
                    <input
                      type="text"
                      name="FullName"
                      value={formData.FullName}
                      onChange={handleInfoChange}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="label-modern">Email Professionnel</label>
                    <input
                      type="email"
                      name="EmailPro"
                      value={formData.EmailPro}
                      onChange={handleInfoChange}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="label-modern">Téléphone</label>
                    <input
                      type="text"
                      name="TelPro"
                      value={formData.TelPro}
                      onChange={handleInfoChange}
                      className="input-modern"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 text-lg font-bold rounded-xl bg-white text-slate-700 border-2 border-slate-100 shadow-lg hover:border-blue-500 hover:text-blue-600 hover:shadow-blue-500/10 transition-all transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                        Sauvegarde...
                      </span>
                    ) : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-luxury animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Sécurité</h2>
                  <p className="text-sm text-slate-500">Mettez à jour votre mot de passe</p>
                </div>
              </div>

              <form onSubmit={onChangePassword} className="space-y-6">
                <div>
                  <label className="label-modern">Mot de passe actuel</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-modern">Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="input-modern"
                    />
                    <p className="text-xs text-slate-400 mt-2">Min. 8 caractères, majuscule, minuscule, chiffre et caractère spécial.</p>
                  </div>
                  <div>
                    <label className="label-modern">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="input-modern"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 text-lg font-bold rounded-xl bg-white text-slate-700 border-2 border-slate-100 shadow-lg hover:border-amber-500 hover:text-amber-600 hover:shadow-amber-500/10 transition-all transform hover:-translate-y-0.5"
                  >
                    {isLoading ? 'Modification...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

