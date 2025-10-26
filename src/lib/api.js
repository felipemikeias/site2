export async function navQuery(){
    const siteNavQueryRes = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
        method: 'post', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            query: `{
                menus(where: {location: PRIMARY}) {
                  nodes {
                    name
                    menuItems {
                        nodes {
                            uri
                            url
                            order
                            label
                        }
                    }
                  }
                }
                generalSettings {
                    title
                    url
                    description
                }
            }
            `
        })
    });
    const{ data } = await siteNavQueryRes.json();
    console.log('navQuery data from API:', data); // CRITICAL: Log the data to inspect its structure
    return data;
}

export async function homePagePostsQuery(){
    const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
        method: 'post', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            query: `{
                posts {
                  nodes {
                    date
                    uri
                    title
                    commentCount
                    excerpt
                    categories {
                      nodes {
                        name
                        uri
                      }
                    }
                    featuredImage {
                      node {
                        srcSet
                        sourceUrl
                        altText
                        mediaDetails {
                          height
                          width
                        }
                      }
                    }
                  }
                }
              }
            `
        })
    });
    const{ data } = await response.json();
    return data;
}


export async function getNodeByURI(uri){
    const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
        method: 'post', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            query: `query GetNodeByURI($uri: String!) {
                nodeByUri(uri: $uri) {
                  __typename
                  isContentNode
                  isTermNode
                  ... on Post {
                    id
                    title
                    date
                    uri
                    excerpt
                    content
                    categories {
                      nodes {
                        name
                        uri
                        slug # Adicionado para buscar o slug da categoria
                      }
                    }
                    featuredImage {
                      node {
                        srcSet
                        sourceUrl
                        altText
                        mediaItemUrl # Adicionado para garantir que a URL da imagem seja buscada
                        mediaDetails {
                          height
                          width
                        }
                      }
                    }
                  }
                  ... on Page {
                    id
                    title
                    uri
                    date
                    content
                  }
                  ... on Category {
                    id
                    name
                    slug # Adicionado para buscar o slug da categoria
                    posts {
                      nodes {
                        date
                        title
                        excerpt
                        uri
                        categories {
                          nodes {
                            name
                            uri
                          }
                        }
                        featuredImage {
                          node {
                            srcSet
                            sourceUrl
                            altText
                            mediaItemUrl # Adicionado para garantir que a URL da imagem seja buscada
                            mediaDetails {
                              height
                              width
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: {
                uri: uri
            }
        })
    });
    const{ data } = await response.json();
    return data;
}

export async function getAllUris(){
  const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
      method: 'post', 
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
          query: `query GetAllUris {
            terms {
              nodes {
                uri
              }
            }
            posts(first: 100) {
              nodes {
                uri
              }
            }
            pages(first: 100) {
              nodes {
                uri
              }
            }
          }
          `
      })
  });
  const{ data } = await response.json();
  const uris = Object.values(data)
    .reduce(function(acc, currentValue){
      return acc.concat(currentValue.nodes)
    }, [])
    .filter(node => node.uri !== null)
    .map(node => {
      let trimmedURI = node.uri.substring(1);
      trimmedURI = trimmedURI.substring(0, trimmedURI.length - 1)
      return {params: {
        uri: trimmedURI
      }}
    })

  return uris;

}

export async function getRecentPosts(limit = 5) {
    const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
        method: 'post',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            query: `query GetRecentPosts($limit: Int!) {
                posts(first: $limit, where: {orderby: {field: DATE, order: DESC}}) {
                  nodes {
                    date
                    uri
                    title
                    excerpt
                    categories {
                      nodes {
                        name
                        uri
                      }
                    }
                    featuredImage {
                      node {
                        srcSet
                        sourceUrl
                        altText
                        mediaDetails {
                          height
                          width
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: {
                limit: limit
            }
        })
    });
    const { data } = await response.json();
    return data.posts.nodes;
}

export async function getRelatedPosts(categorySlug, excludeUri, limit = 4) {
    console.log('getRelatedPosts: Iniciando requisição para posts relacionados...');
    console.log('getRelatedPosts: categorySlug:', categorySlug);
    console.log('getRelatedPosts: excludeUri:', excludeUri);
    console.log('getRelatedPosts: limit:', limit);

    const queryBody = JSON.stringify({
        query: `query GetRelatedPosts($categorySlug: String!, $excludeUri: String!, $limit: Int!) {
            posts(first: $limit, where: {categoryName: $categorySlug, notIn: [$excludeUri], orderby: {field: DATE, order: DESC}}) {
              nodes {
                date
                uri
                title
                excerpt
                categories {
                  nodes {
                    name
                    uri
                    slug
                  }
                }
                featuredImage {
                  node {
                    srcSet
                    sourceUrl
                    altText
                    mediaItemUrl
                    mediaDetails {
                      height
                      width
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
            categorySlug: categorySlug,
            excludeUri: excludeUri,
            limit: limit
        }
    });

    console.log('getRelatedPosts: GraphQL Query Body:', queryBody);

    try {
        const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
            method: 'post',
            headers: {'Content-Type':'application/json'},
            body: queryBody
        });

        console.log('getRelatedPosts: Raw API Response Status:', response.status);
        console.log('getRelatedPosts: Raw API Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('getRelatedPosts: API Response Error (not ok):', response.status, errorText);
            return [];
        }

        const jsonResponse = await response.json();
        console.log('getRelatedPosts: Full JSON Response from API:', jsonResponse);

        if (jsonResponse.errors) {
            console.error('getRelatedPosts: GraphQL Errors:', jsonResponse.errors);
            return [];
        }

        const { data } = jsonResponse;
        console.log('getRelatedPosts: Extracted data from JSON Response:', data);

        if (data && data.posts && data.posts.nodes) {
            console.log('getRelatedPosts: Posts found:', data.posts.nodes.length);
            return data.posts.nodes;
        } else {
            console.warn('getRelatedPosts: Nenhum post encontrado para a query de posts relacionados ou a estrutura dos dados é inesperada:', data);
            return [];
        }
    } catch (error) {
        console.error('getRelatedPosts: Erro na requisição da API:', error);
        return [];
    }
}

export async function getAllCategories() {
    const response = await fetch(import.meta.env.VITE_WORDPRESS_API_URL, {
        method: 'post',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            query: `query GetAllCategories {
                categories(first: 100) {
                  nodes {
                    name
                    uri
                    slug
                  }
                }
              }
            `
        })
    });
    const { data } = await response.json();
    console.log('getAllCategories data from API:', data);
    return data.categories.nodes;
}
