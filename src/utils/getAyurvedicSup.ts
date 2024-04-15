import AyurvedicMaster from "../models/masters/ayurvedic_master"

export const getAyurvedicSup = async (constitutions: number[]) => {
    try {
        const constitutionMap: {[key: string]: string} = { '1': 'Vata', '2': 'Pitta', '3': 'Kapha' };
        const constitutionsText = constitutions.map(num => constitutionMap[num.toString()]);

        const sups = await AyurvedicMaster.findAll({ raw: true });

        if (!sups) {
            return [];
        }

        // Filtrar los registros después de recuperarlos de la base de datos
        const filteredSups = sups.filter((sup: any) => {
            const supConstitutions = sup.constitution.split('-').sort();
            const requiredConstitutions = [...constitutionsText].sort();

            // Comparar si ambos arreglos son iguales
            return supConstitutions.length === requiredConstitutions.length && 
                   supConstitutions.every((value: string, index: number) => value === requiredConstitutions[index]);
        });

        return filteredSups;

    } catch (error: any) {
        console.log(error);
        return [];
    }
}
