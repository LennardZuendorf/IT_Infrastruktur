import fetch from 'node-fetch';
import querystring from 'querystring';

export const handler = async (event) => {
    const params = {
        country: 'us',
        services: 'netflix,prime.buy,hulu.addon.hbo,peacock.free',
        output_language: 'en',
        show_type: 'movie',
        genre: '18',
        show_original_language: 'en',
        keyword: 'zombie'
    };

    // TODO: Replace API Keys!!!
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '132f691e43msh4ee0522a71a444ap13e682jsn16d612ce6929',
            'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
        }
    };

    try {
        const queryString = querystring.stringify(params);
        const response = await fetch(`https://streaming-availability.p.rapidapi.com/v2/search/basic?${queryString}`, options);
        const body = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error.message)
        };
    }
};
