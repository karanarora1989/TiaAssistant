'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card } from '@/components/tia/shared';

interface Contact {
  name: string;
  email?: string;
  phone?: string;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  // Detect if Contacts API is available
  const isContactsAPIAvailable = typeof navigator !== 'undefined' && 'contacts' in navigator;

  const importFromPhone = async () => {
    setError('');
    setLoading(true);

    try {
      if (!isContactsAPIAvailable) {
        setError('Contact import is not supported on this device');
        setLoading(false);
        return;
      }

      // Request contacts from phone
      const contacts = await (navigator as any).contacts.select(
        ['name', 'email', 'tel'],
        { multiple: true }
      );

      // Transform to our format
      const formattedContacts: Contact[] = contacts.map((c: any) => ({
        name: c.name?.[0] || '',
        email: c.email?.[0] || undefined,
        phone: c.tel?.[0] || undefined,
      })).filter((c: Contact) => c.name.trim().length > 0);

      if (formattedContacts.length === 0) {
        setError('No contacts selected');
        setLoading(false);
        return;
      }

      setSelectedContacts(formattedContacts);
      setShowPreview(true);
      setLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled
        setLoading(false);
        return;
      }
      console.error('Contact import error:', err);
      setError('Failed to import contacts. Please try again.');
      setLoading(false);
    }
  };

  const handleManualImport = () => {
    if (!manualInput.trim()) {
      setError('Please enter at least one name');
      return;
    }

    const names = manualInput
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      setError('Please enter at least one name');
      return;
    }

    const contacts: Contact[] = names.map(name => ({ name }));
    setSelectedContacts(contacts);
    setShowPreview(true);
  };

  const confirmImport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/people/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: selectedContacts }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import contacts');
      }

      // Success - redirect to people page
      router.push('/app/people');

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col">
        <TopBar
          title="Preview Contacts"
          backLabel="Back"
          onBack={() => {
            setShowPreview(false);
            setSelectedContacts([]);
            setManualInput('');
          }}
        />

        <div className="flex-1 px-6 py-6 overflow-y-auto pb-32">
          <p className="text-sm text-text-secondary mb-4">
            Review contacts before importing
          </p>

          <div className="space-y-3 mb-6">
            {selectedContacts.map((contact, i) => (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {contact.name}
                    </p>
                    {contact.email && (
                      <p className="text-xs text-text-secondary mt-1">
                        📧 {contact.email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-xs text-text-secondary mt-1">
                        📞 {contact.phone}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 bg-gold/10 rounded-xl mb-6">
            <p className="text-sm text-text-primary">
              Will import: <span className="font-medium">{selectedContacts.length}</span> contact{selectedContacts.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Default sensitivity: Medium
            </p>
          </div>

          {error && (
            <div className="p-4 bg-overdue-red/10 border border-overdue-red rounded-xl mb-6">
              <p className="text-sm text-overdue-red">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <Button
            onClick={confirmImport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Importing...</span>
              </>
            ) : (
              `Import ${selectedContacts.length} Contact${selectedContacts.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Import Contacts"
        backLabel="People"
        onBack={() => router.push('/app/people')}
      />

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Mobile: Contacts API */}
        {isContactsAPIAvailable && (
          <Card className="mb-6">
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Import from Phone
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                Access your phone contacts and select who to import
              </p>
              <Button
                onClick={importFromPhone}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>📇</span>
                    <span>Import from Phone Contacts</span>
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-border-1">
              <p className="text-xs text-text-secondary">
                Tia will import:
              </p>
              <ul className="text-xs text-text-muted mt-2 space-y-1">
                <li>• Name</li>
                <li>• Email (if available)</li>
                <li>• Phone number (if available)</li>
              </ul>
              <p className="text-xs text-text-muted mt-2">
                Default sensitivity: Medium
              </p>
            </div>
          </Card>
        )}

        {/* Desktop: Manual Entry */}
        {!isContactsAPIAvailable && (
          <Card className="mb-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-4">💻</div>
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Desktop Mode
              </h3>
              <p className="text-xs text-text-secondary">
                Contact import works on mobile devices. Use manual entry below:
              </p>
            </div>
          </Card>
        )}

        {/* Manual Entry (both mobile and desktop) */}
        <Card>
          <h3 className="text-xs text-text-secondary mb-3 uppercase tracking-wider-03">
            {isContactsAPIAvailable ? 'Or add manually' : 'Add People'}
          </h3>
          
          <p className="text-xs text-text-secondary mb-2">
            Enter names (one per line):
          </p>
          
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
            className="w-full h-32 px-3 py-2 bg-surface-0 border border-border-1 rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold resize-none"
          />

          <Button
            onClick={handleManualImport}
            disabled={loading || !manualInput.trim()}
            className="w-full mt-3"
          >
            Add People
          </Button>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-surface-1 rounded-xl">
          <p className="text-xs text-text-secondary">
            💡 <span className="font-medium">Tip:</span> Duplicates will be automatically skipped
          </p>
        </div>
      </div>
    </div>
  );
}
