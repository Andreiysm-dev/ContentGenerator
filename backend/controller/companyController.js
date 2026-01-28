import db from '../database/db.js';

export const getCompany = async (req, res) => {
    try{
        
        const {data: company ,error: companyError} = await db
            .from('company')
            .select("*")
        
        console.log(company)

    }catch(error){
        console.log(error)
    }

}