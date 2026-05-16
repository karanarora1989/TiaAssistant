'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TopBar, Card, LoadingSpinner } from '@/components/tia/shared';

interface Person {
  name: string;
  email?: string;
  phone?: string;
}

export default function OnboardingPeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [supportsContacts, setSupportsContacts] = useState(false);

  // Check if Contacts API is available
  useState(() => {
    setSupportsContacts('contacts' in navigator);
  });

  const importFromContacts = async () => {
    try {
      if (!('contacts' in navigator)) {
        alert('Contacts API not available on this device. Please add manually.');
        return;
      }

      const contacts = await (navigator as any).contacts.select(
        ['name', 'email', 'tel'],
        { multiple: true }
      );

      const imported: Person[] = contacts.map((contact: any) => ({
        name: contact.name?.[0] || 'Unknown',
        email: contact.email?.[0],
        phone: contact.tel?.[0],
      }));

      setPeople([...people, ...imported]);
    } catch (error) {
      console.error('Contact import failed:', error);
      alert('Failed to import contacts. Please try adding manually.');
    }
  };

  const handleAddPerson = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const person: Person = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
    };

    if (!person.name.trim()) {
      setError('Name is required');
      return;
    }

    setPeople([...people, person]);
    setShowForm(false);
    setError('');
    e.currentTarget.reset();
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (people.length === 0) {
      // Skip if no people added
      router.push('/app/onboarding/done');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save people');
      }

      router.push('/app/onboarding/done');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/app/onboarding/done');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Your Team"
        backLabel="Back"
        onBack={() => router.push('/app/onboarding/style')}
      />

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light text-text-primary">
              Who do you work with?
            </h1>
            <p className="text-sm text-text-secondary">
              Add your team members so Tia can follow up with them on tasks
            </p>
          </div>

          {/* Import Options */}
          {people.length === 0 && !showForm && (
            <div className="space-y-3">
              {supportsContacts && (
                <Button
                  onClick={importFromContacts}
                  className="w-full flex items-center justify-center gap-2"
                >
                  📱 Import from Contacts
                </Button>
              )}
              
              <Button
                onClick={() => setShowForm(true)}
                variant="ghost"
                className="w-full"
              >
                ✏️ Add Manually
              </Button>

              <button
                onClick={handleSkip}
                className="w-full text-xs text-text-muted hover:text-text-secondary text-center py-2 transition-smooth"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Manual Entry Form */}
          {showForm && (
            <Card>
              <form onSubmit={handleAddPerson} className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g., John Smith"
                    required
                    className="w-full px-4 py-2 bg-surface-1 border border-border-1 rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="e.g., john@company.com"
                    className="w-full px-4 py-2 bg-surface-1 border border-border-1 rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Phone (optional)
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="e.g., +91-9876543210"
                    className="w-full px-4 py-2 bg-surface-1 border border-border-1 rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold transition-smooth"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add Person
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Added People */}
          {people.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">
                Added {people.length} {people.length === 1 ? 'person' : 'people'}
              </h3>

              {people.map((person, index) => (
                <Card key={index} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary">
                      {person.name}
                    </h4>
                    {person.email && (
                      <p className="text-xs text-text-secondary mt-1">
                        📧 {person.email}
                      </p>
                    )}
                    {person.phone && (
                      <p className="text-xs text-text-secondary mt-1">
                        📱 {person.phone}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removePerson(index)}
                    className="text-xs text-overdue-red hover:text-overdue-red/80 transition-smooth"
                  >
                    Remove
                  </button>
                </Card>
              ))}

              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="ghost"
                  className="w-full"
                >
                  + Add Another Person
                </Button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
              <p className="text-sm text-overdue-red">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      {people.length > 0 && (
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={handleContinue}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              `Continue with ${people.length} ${people.length === 1 ? 'person' : 'people'} →`
            )}
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-xs text-text-muted hover:text-text-secondary text-center py-2 transition-smooth"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
