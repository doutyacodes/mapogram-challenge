import React, { useState, useEffect } from 'react';
import { X, User, Users, Crown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AccountManagerModal = ({ isOpen, onClose, currentIdentity, loggedInUserId, switchIdentity }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const router = useRouter(); // 🧠 Add this line

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

const handleSwitch = async (type, id) => {
  try {
    if (!isCurrentAccount({ type, id })) {
      await switchIdentity(type, id);
    }
  } catch (err) {
    setError('Failed to switch account');
    console.error('Error switching account:', err);
  } finally {
    onClose();
    // Always navigate
    if (type === 'user') {
      router.push(`/profile/${id}`);
    } else if (type === 'page') {
      router.push(`/page/${id}`);
    }
  }
};


  const isCurrentAccount = (account) => {
    return currentIdentity?.type === account.type && currentIdentity?.id === account.id;
  };

  const getAccountIcon = (account) => {
    if (account.type === 'user') {
      return <User className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    return account.is_owner ? 
      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : 
      <Users className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  const getAccountBadge = (account) => {
    if (account.type === 'user') {
      return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Personal</span>;
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        account.is_owner 
          ? 'bg-yellow-100 text-yellow-700' 
          : 'bg-green-100 text-green-700'
      }`}>
        {account.is_owner ? 'Owner' : 'Admin'}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Accounts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={fetchAccounts}
                className="mt-3 text-blue-600 text-sm hover:text-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-sm">
              No accounts found
            </div>
          ) : (
            <div className="p-2 sm:p-4 space-y-2">
              {accounts.map((account) => (
                <div
                  key={`${account.type}-${account.id}`}
                  className={`relative rounded-lg border transition-all ${
                    isCurrentAccount(account)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => handleSwitch(account.type, account.id)}
                    className="w-full p-3 sm:p-4 text-left"
                    // disabled={isCurrentAccount(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          {account.profile_pic_url ? (
                            <img
                              src={account.profile_pic_url}
                              alt={account.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {getAccountIcon(account)}
                            </div>
                          )}
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                              {account.name}
                            </h3>
                            {getAccountBadge(account)}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            @{account.username}
                          </p>
                          {account.bio && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {account.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Switch Indicator */}
                      <div className="flex-shrink-0 ml-2">
                        {isCurrentAccount(account) ? (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Current Account Indicator */}
                  {isCurrentAccount(account) && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 sm:p-6">
          <p className="text-xs text-gray-500 text-center">
            Switch between your personal account and pages you manage
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagerModal;