function extractKey(key, data) {
    // we assume data is either null, a string, an array or an object
    if (!data || typeof data === "string") return null;
    if (Array.isArray(data)) {
        for (let value of data) {
            let res = extractKey(key, value);
            if (res) return res;
        }
    } else {
        for (let [currKey, value] of Object.entries(data)) {
            if (currKey === key) return value;
            let res = extractKey(key, value);
            if (res) return res;
        }
    }
    return null;
}

function getCarFromListing(listing) {
    let priceUSD = parseInt(
        listing?.listing_price?.amount_with_offset_in_currency
    );
    if (!isNaN(priceUSD)) priceUSD = `${priceUSD / 100}`;
    else priceUSD = undefined;
    return {
        id: listing?.id,
        created_at: `${Date.now()}`,
        title: listing?.custom_title,
        url: listing?.id
            ? `https://www.facebook.com/marketplace/item/${listing.id}`
            : undefined,
        pictureUrl: listing?.primary_listing_photo?.image?.uri,
        price: listing?.listing_price?.amount,
        priceUSD,
        priceFormatted: listing?.listing_price?.formatted_amount,
        locationDisplay:
            listing?.location?.reverse_geocode?.city_page?.display_name,
        city: listing?.location?.reverse_geocode?.city,
        state: listing?.location?.reverse_geocode?.state,
        subtitles: listing?.custom_sub_titles_with_rendering_flags?.map(
            (el) => el?.subtitle
        ),
        seller: listing?.marketplace_listing_seller?.name,
    };
}

export { extractKey, getCarFromListing };