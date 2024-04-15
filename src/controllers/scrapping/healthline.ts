import axios from "axios"
import HealthLineArticles from "../../models/healthline_articles"
import { Op } from 'sequelize'

export const getHealthLineLinks = async(url: string) => {
    try{
        const config = {
            method: "post",
            // url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/healthline/get_article_links",
            url: "http://localhost:8001/healthline/get_article_links",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            data: {url},
        }
        let articles: any
        await axios(config).then((response: any) => {
            articles = response.data
        })
        const existingArticles = await HealthLineArticles.findAll({
			attributes: ['url'],
			where: {
				url: {
					[Op.in]: articles
				}
			}
		})
        return articles?.article_links
    } catch (error: any) {
        return error
    } 
}

export const saveHealthLineArticles = async(links: string[]) => {
    try {
        links.forEach(async(val: string) => {
            try {
                const existingArticle = await HealthLineArticles.findOne({ where: { url: val } });
                if(!existingArticle){
                    const config = {
                        method: "post",
                        // url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/healthline/get_article_content",
                        url: "http://localhost:8001/healthline/get_article_content",
                        headers: {
                            accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        data: {url: val}
                    }
                    let article: any
                    await axios(config).then((response: any) => {
                        article = response.data;
                    })
                    const HealthArticle = new HealthLineArticles(article?.article_content)
                    await HealthArticle.save();
                }
            } catch (error) {
                console.error(`Error processing the article ${val}:`, error);
            } 
        })
        return true
    } catch(error: any) {
        console.error("Error while saving healthline content:", error);
        return false
    }
}