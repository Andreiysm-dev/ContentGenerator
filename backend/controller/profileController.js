import db from '../database/db.js';

// GET - Fetch current user's profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                // Profile doesn't exist, create one
                const { data: newProfile, error: createError } = await db
                    .from('profiles')
                    .insert([{ id: userId, onboarding_completed: false }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating profile:', createError);
                    return res.status(500).json({
                        error: 'Failed to create profile',
                        details: createError.message,
                    });
                }

                return res.status(200).json({ profile: newProfile });
            }

            console.error('Error fetching profile:', profileError);
            return res.status(500).json({
                error: 'Failed to fetch profile',
                details: profileError.message,
            });
        }

        return res.status(200).json({ profile });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT - Update current user's profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { role, onboarding_completed } = req.body;

        // Fetch current profile to check existing role
        const { data: currentProfile } = await db
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        // Build update object with only provided fields
        const updateData = {};

        // Prevent non-admins from promoting to ADMIN, and prevent ADMINS from losing their status
        if (role !== undefined) {
            if (currentProfile?.role !== 'ADMIN' && role !== 'ADMIN') {
                updateData.role = role;
            }
        }
        if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length === 1) {
            // Only updated_at, no actual changes
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data: profile, error: profileError } = await db
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select();

        if (profileError) {
            console.error('Error updating profile:', profileError);
            return res.status(500).json({
                error: 'Failed to update profile',
                details: profileError.message,
            });
        }

        if (!profile || profile.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            profile: profile[0],
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET - Fetch user notification settings for a company
export const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { companyId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Using auth user metadata for persistent settings without schema changes
        const { data: { user }, error: authError } = await db.auth.admin.getUserById(userId);
        if (authError || !user) return res.status(404).json({ error: 'User not found' });

        const settings = user.user_metadata?.notification_preferences?.[companyId] || {};
        return res.status(200).json({
            watchedColumns: settings.watchedColumns || {},
            emailNotificationsEnabled: settings.emailNotificationsEnabled || false,
            collapsedColumns: settings.collapsedColumns || {}
        });
    } catch (error) {
        console.error('getNotificationSettings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT - Update user notification settings for a company
export const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { companyId } = req.params;
        const { watchedColumns, emailNotificationsEnabled, collapsedColumns } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Get current user metadata
        const { data: { user }, error: fetchError } = await db.auth.admin.getUserById(userId);
        if (fetchError || !user) return res.status(404).json({ error: 'User not found' });

        const currentPrefs = user.user_metadata?.notification_preferences || {};
        const updatedPrefs = {
            ...currentPrefs,
            [companyId]: {
                ...currentPrefs[companyId],
                watchedColumns,
                emailNotificationsEnabled,
                collapsedColumns: collapsedColumns !== undefined ? collapsedColumns : currentPrefs[companyId]?.collapsedColumns
            }
        };

        const { error: updateError } = await db.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...user.user_metadata,
                notification_preferences: updatedPrefs
            }
        });

        if (updateError) {
            console.error('Error updating notification preferences:', updateError);
            return res.status(500).json({ error: 'Failed to update preferences' });
        }

        return res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('updateNotificationSettings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
