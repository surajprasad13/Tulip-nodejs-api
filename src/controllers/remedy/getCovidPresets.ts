export const getCovidPresets = async(presets: any) => {
    try{
        let freq: any = {};
        presets.forEach((item: any) => {
            freq[item[0]] = {freq: freq[item[0]] ? freq[item[0]]['freq'] + 1 : 1, weight: item[1]}
        })
        let sortable:any[] = []
        Object.keys(freq).forEach((key: any) => {
            sortable.push([key, freq[key]['freq'], freq[key]['weight']])
        })
        sortable.sort(function(a, b) {
            return (b[1] - a[1] || a[2] - b[2])
        })
        return sortable.slice(0, 3).map((val: any) => Number(val[0]))
    } catch(error) {
        console.log(error)
        return []
    }
}