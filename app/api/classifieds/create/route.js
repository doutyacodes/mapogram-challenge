// /api/classifieds/create/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { POST_LAYER_MAP, USER_POSTS } from '@/utils/schema/schema';
import { 
  USER_CLASSIFIED_DETAILS, 
  CLASSIFIED_VEHICLE_DETAILS,
  CLASSIFIED_ELECTRONICS_DETAILS,
  CLASSIFIED_FURNITURE_DETAILS,
  CLASSIFIED_REAL_ESTATE_DETAILS,
  CLASSIFIED_IMAGES
} from '@/utils/schema/classifieds_schema';

export async function POST(req) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const data = await req.json();
    
    const {
      categoryId,
      subCategoryId,
      title,
      description,
      price,
      priceType,
      condition,
      listingType = 'sell',
      contactPhone,
      contactEmail,
      preferredContact,
      latitude,
      longitude,
      deleteAfterHours,
      images = [],
      vehicleData,
      electronicsData,
      furnitureData,
      realEstateData,
      selectedLayers,
    } = data;

    // Validate required fields
    if (!categoryId || !subCategoryId || !title || !description || !price || !latitude || !longitude) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    // Create main post entry
    const [postResult] = await db
      .insert(USER_POSTS)
      .values({
        creator_type: 'user',
        creator_id: userId,
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id: parseInt(categoryId),
        post_type: 'classifieds',
        delete_after_hours: deleteAfterHours,
        is_permanent: false,
        is_story: false
      });

    const postId = postResult.insertId;

    // Calculate available_until date
    const availableUntil = new Date();
    availableUntil.setHours(availableUntil.getHours() + deleteAfterHours);

    // Create classified details entry
    const [classifiedResult] = await db
      .insert(USER_CLASSIFIED_DETAILS)
      .values({
        post_id: postId,
        sub_category_id: parseInt(subCategoryId),
        listing_type: listingType,
        price: parseFloat(price),
        price_type: priceType,
        condition: condition || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        preferred_contact: preferredContact,
        available_until: availableUntil.toISOString().split('T')[0]
      });

    const classifiedId = classifiedResult.insertId;

    // Insert category-specific details
    if (vehicleData) {
      await db
        .insert(CLASSIFIED_VEHICLE_DETAILS)
        .values({
          classified_id: classifiedId,
          brand_id: vehicleData.brandId ? parseInt(vehicleData.brandId) : null,
          model_id: vehicleData.modelId ? parseInt(vehicleData.modelId) : null,
          year: vehicleData.year ? parseInt(vehicleData.year) : null,
          mileage_km: vehicleData.mileageKm ? parseInt(vehicleData.mileageKm) : null,
          fuel_type: vehicleData.fuelType,
          transmission: vehicleData.transmission,
          engine_capacity: vehicleData.engineCapacity || null,
          registration_year: vehicleData.registrationYear ? parseInt(vehicleData.registrationYear) : null,
          insurance_valid_until: vehicleData.insuranceValidUntil || null,
          pollution_certificate_valid: vehicleData.pollutionCertificateValid || false,
          color: vehicleData.color || null,
          number_of_owners: vehicleData.numberOfOwners ? parseInt(vehicleData.numberOfOwners) : 1
        });
    }

    if (electronicsData) {
      await db
        .insert(CLASSIFIED_ELECTRONICS_DETAILS)
        .values({
          classified_id: classifiedId,
          brand_id: electronicsData.brandId ? parseInt(electronicsData.brandId) : null,
          model: electronicsData.model || null,
          warranty_months_left: electronicsData.warrantyMonthsLeft ? parseInt(electronicsData.warrantyMonthsLeft) : null,
          bill_available: electronicsData.billAvailable || false,
          box_available: electronicsData.boxAvailable || false,
          storage_capacity: electronicsData.storageCapacity || null,
          ram: electronicsData.ram || null,
          processor: electronicsData.processor || null,
          screen_size: electronicsData.screenSize || null,
          energy_rating: electronicsData.energyRating ? parseInt(electronicsData.energyRating) : null
        });
    }

    if (furnitureData) {
      await db
        .insert(CLASSIFIED_FURNITURE_DETAILS)
        .values({
          classified_id: classifiedId,
          material: furnitureData.material || null,
          color: furnitureData.color || null,
          dimensions: furnitureData.dimensions || null,
          weight_kg: furnitureData.weightKg ? parseFloat(furnitureData.weightKg) : null,
          seating_capacity: furnitureData.seatingCapacity ? parseInt(furnitureData.seatingCapacity) : null,
          number_of_pieces: furnitureData.numberOfPieces ? parseInt(furnitureData.numberOfPieces) : 1,
          assembly_required: furnitureData.assemblyRequired || false,
          brand: furnitureData.brand || null
        });
    }

    if (realEstateData) {
      await db
        .insert(CLASSIFIED_REAL_ESTATE_DETAILS)
        .values({
          classified_id: classifiedId,
          property_type: realEstateData.propertyType,
          area_sqft: realEstateData.areaSqft ? parseInt(realEstateData.areaSqft) : null,
          area_unit: realEstateData.areaUnit || 'sqft',
          bedrooms: realEstateData.bedrooms ? parseInt(realEstateData.bedrooms) : null,
          bathrooms: realEstateData.bathrooms ? parseInt(realEstateData.bathrooms) : null,
          floor_number: realEstateData.floorNumber ? parseInt(realEstateData.floorNumber) : null,
          total_floors: realEstateData.totalFloors ? parseInt(realEstateData.totalFloors) : null,
          parking: realEstateData.parking || false,
          furnished: realEstateData.furnished || 'unfurnished',
          monthly_rent: realEstateData.monthlyRent ? parseFloat(realEstateData.monthlyRent) : null,
          security_deposit: realEstateData.securityDeposit ? parseFloat(realEstateData.securityDeposit) : null,
          maintenance_charges: realEstateData.maintenanceCharges ? parseFloat(realEstateData.maintenanceCharges) : null,
          construction_year: realEstateData.constructionYear ? parseInt(realEstateData.constructionYear) : null,
          ready_to_move: realEstateData.readyToMove || true,
          clear_title: realEstateData.clearTitle || true
        });
    }

    // Insert images
    if (images && images.length > 0) {
      const imageValues = images.map((imagePath, index) => ({
        classified_id: classifiedId,
        image_url: imagePath,
        display_order: index + 1,
        is_primary: index === 0
      }));

      await db.insert(CLASSIFIED_IMAGES).values(imageValues);
    }

    // Handle layer mappings
    if (selectedLayers && selectedLayers.length > 0) {
      const layerMappings = selectedLayers.map(layerId => ({
        post_id: postId,
        layer_id: layerId,
      }));

      await db.insert(POST_LAYER_MAP).values(layerMappings);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Classified created successfully",
      postId,
      classifiedId
    });

  } catch (error) {
    console.error("Error creating classified:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create classified" 
    }, { status: 500 });
  }
}
