const fetchProductsFromShopify = async (shop , accessToken) => {
    const response = await fetch(`https://${shop}/admin/api/2023-01/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });
    return response.json();
  };