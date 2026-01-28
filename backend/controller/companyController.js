import db from '../database/db.js';

// CREATE - Add a new company
export const createCompany = async (req, res) => {
    try {
        const { companyName, companyDescription } = req.body;

        // Validate required fields
        if (!companyName) {
            return res.status(400).json({ 
                error: 'Company name is required' 
            });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .insert([
                { 
                    companyName, 
                    companyDescription,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (companyError) {
            console.error('Error creating company:', companyError);
            return res.status(500).json({ 
                error: 'Failed to create company',
                details: companyError.message 
            });
        }

        return res.status(201).json({ 
            message: 'Company created successfully',
            company: company[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get all companies
export const getCompany = async (req, res) => {
    try {
        const { data: companies, error: companyError } = await db
            .from('company')
            .select('*')
            .order('created_at', { ascending: false });

        if (companyError) {
            console.error('Error fetching companies:', companyError);
            return res.status(500).json({ 
                error: 'Failed to fetch companies',
                details: companyError.message 
            });
        }

        return res.status(200).json({ 
            companies,
            count: companies.length 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get a single company by ID
export const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: company, error: companyError } = await db
            .from('company')
            .select('*')
            .eq('companyId', id)
            .single();

        if (companyError) {
            if (companyError.code === 'PGRST116') {
                return res.status(404).json({ 
                    error: 'Company not found' 
                });
            }
            console.error('Error fetching company:', companyError);
            return res.status(500).json({ 
                error: 'Failed to fetch company',
                details: companyError.message 
            });
        }

        return res.status(200).json({ company });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// UPDATE - Update a company by ID
export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, companyDescription } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (companyName !== undefined) updateData.companyName = companyName;
        if (companyDescription !== undefined) updateData.companyDescription = companyDescription;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No fields to update' 
            });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .update(updateData)
            .eq('companyId', id)
            .select();

        if (companyError) {
            console.error('Error updating company:', companyError);
            return res.status(500).json({ 
                error: 'Failed to update company',
                details: companyError.message 
            });
        }

        if (!company || company.length === 0) {
            return res.status(404).json({ 
                error: 'Company not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Company updated successfully',
            company: company[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// DELETE - Delete a company by ID
export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: company, error: companyError } = await db
            .from('company')
            .delete()
            .eq('companyId', id)
            .select();

        if (companyError) {
            console.error('Error deleting company:', companyError);
            return res.status(500).json({ 
                error: 'Failed to delete company',
                details: companyError.message 
            });
        }

        if (!company || company.length === 0) {
            return res.status(404).json({ 
                error: 'Company not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Company deleted successfully',
            company: company[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};