import React, { useState } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { sendWorkspaceInvitation, sendBoardInvitation } from '../api';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  boardId?: string;
  type: 'workspace' | 'board';
  onInviteSent?: () => void;
}

interface InviteFormData {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

interface InvitationResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  boardId,
  type,
  onInviteSent,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: type === 'workspace' ? 'MEMBER' : 'VIEWER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const roleOptions = type === 'workspace'
    ? [
        { value: 'OWNER', label: 'Owner', description: 'Full control' },
        { value: 'ADMIN', label: 'Admin', description: 'Manage workspace' },
        { value: 'MEMBER', label: 'Member', description: 'View only' },
      ]
    : [
        { value: 'OWNER', label: 'Owner', description: 'Full board control' },
        { value: 'ADMIN', label: 'Admin', description: 'Manage board' },
        { value: 'EDITOR', label: 'Editor', description: 'Edit assigned cards' },
        { value: 'COMMENTER', label: 'Commenter', description: 'View & comment' },
        { value: 'VIEWER', label: 'Viewer', description: 'View only' },
      ];

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      email: e.target.value,
    }));
    setError(null);
  };

  const handleRoleChange = (role: any) => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (sentEmails.includes(formData.email)) {
      setError('Invitation already sent to this email');
      return;
    }

    setLoading(true);

    try {
      if (type === 'workspace' && workspaceId) {
        await sendWorkspaceInvitation(workspaceId, formData.email.toLowerCase(), formData.role);
      } else if (type === 'board' && boardId) {
        await sendBoardInvitation(boardId, formData.email.toLowerCase(), formData.role);
      } else {
        throw new Error('Invalid invitation type or missing resource ID');
      }

      setSuccess(`Invitation sent to ${formData.email}`);
      setSentEmails(prev => [...prev, formData.email]);
      setFormData({
        email: '',
        role: type === 'workspace' ? 'MEMBER' : 'VIEWER',
      });

      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      onInviteSent?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className={`rounded-lg shadow-lg max-w-md w-full ${theme === 'dark' ? 'bg-surface-900 border-surface-700' : 'bg-white border-surface-200'} border`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-primary-500" />
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
              Invite to {type === 'workspace' ? 'Workspace' : 'Board'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-surface-800' : 'hover:bg-surface-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-red-100' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${theme === 'dark' ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-green-100' : 'text-green-700'}`}>{success}</p>
            </div>
          )}

          {/* Sent Emails List */}
          {sentEmails.length > 0 && (
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-surface-800' : 'bg-surface-50'}`}>
              <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>
                Invitations sent ({sentEmails.length})
              </p>
              <div className="space-y-1">
                {sentEmails.map(email => (
                  <div key={email} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>
                      {email}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="user@example.com"
                className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-primary-500 ${
                  theme === 'dark'
                    ? 'bg-surface-800 border-surface-700 text-surface-50 placeholder-surface-500'
                    : 'bg-surface-50 border-surface-300 text-surface-900 placeholder-surface-400'
                }`}
                disabled={loading}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>
                Role
              </label>
              <div className="space-y-2">
                {roleOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-surface-100' : 'text-surface-900'}`}>
                        {option.label}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-surface-800 text-surface-100 hover:bg-surface-700'
                    : 'bg-surface-200 text-surface-900 hover:bg-surface-300'
                }`}
                disabled={loading}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  loading
                    ? theme === 'dark'
                      ? 'bg-primary-900 text-primary-300'
                      : 'bg-primary-200 text-primary-600'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Text */}
          <p className={`text-xs text-center ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
            Invitations expire in 7 days. The recipient will receive an email with instructions.
          </p>
        </div>
      </div>
    </div>
  );
};
