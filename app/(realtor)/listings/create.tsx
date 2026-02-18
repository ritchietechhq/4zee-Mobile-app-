import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { propertyService } from '@/services/property.service';
import { CreatePropertyRequest, PropertyType, Property } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'Villa', value: 'villa' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Penthouse', value: 'penthouse' },
  { label: 'Studio', value: 'studio' },
  { label: 'Land', value: 'land' },
  { label: 'Commercial', value: 'commercial' },
];

export default function CreateListing() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const isEditing = !!propertyId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProperty, setIsFetchingProperty] = useState(false);
  const [hasInstallment, setHasInstallment] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [amenities, setAmenities] = useState('');

  // Installment fields
  const [downPayment, setDownPayment] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');

  // Load existing property for editing
  useEffect(() => {
    if (isEditing && propertyId) {
      loadProperty(propertyId);
    }
  }, [propertyId]);

  const loadProperty = async (id: string) => {
    setIsFetchingProperty(true);
    try {
      const property = await propertyService.getPropertyById(id);
      setTitle(property.title);
      setDescription(property.description);
      setPropertyType(property.type);
      setPrice(String(property.price));
      setBedrooms(String(property.bedrooms));
      setBathrooms(String(property.bathrooms));
      setArea(String(property.area));
      setCity(property.address?.city || '');
      setState(property.address?.state || '');
      setCountry(property.address?.country || '');
      setStreet(property.address?.street || '');
      setZipCode(property.address?.zipCode || '');
      setLatitude(String(property.address?.latitude || ''));
      setLongitude(String(property.address?.longitude || ''));
      setAmenities((property.amenities || []).join(', '));

      if (property.installmentPlan) {
        setHasInstallment(true);
        setDownPayment(String(property.installmentPlan.downPayment || ''));
        setMonthlyAmount(String(property.installmentPlan.monthlyAmount || ''));
        setTotalInstallments(String(property.installmentPlan.totalInstallments || ''));
      }
    } catch {
      Alert.alert('Error', 'Failed to load property details.');
      router.back();
    } finally {
      setIsFetchingProperty(false);
    }
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a property title.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter a description.');
      return false;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation', 'Please enter a city.');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Validation', 'Please enter a state.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: CreatePropertyRequest = {
        title: title.trim(),
        description: description.trim(),
        type: propertyType,
        price: Number(price),
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        area: Number(area) || 0,
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim() || 'Pakistan',
          zipCode: zipCode.trim(),
          latitude: latitude ? Number(latitude) : 0,
          longitude: longitude ? Number(longitude) : 0,
        },
        amenities: amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        hasInstallmentPlan: hasInstallment,
      };

      if (hasInstallment) {
        payload.installmentDetails = {
          downPayment: Number(downPayment) || 0,
          monthlyAmount: Number(monthlyAmount) || 0,
          totalInstallments: Number(totalInstallments) || 0,
        };
      }

      if (isEditing && propertyId) {
        await propertyService.updateProperty(propertyId, payload);
        Alert.alert('Success', 'Listing updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await propertyService.createProperty(payload);
        Alert.alert('Success', 'Listing created successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingProperty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading property...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Listing' : 'New Listing'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Input
              label="Property Title"
              placeholder="e.g. Luxury 3BR Apartment"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Description"
              placeholder="Describe the property..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />

            {/* Property Type Picker */}
            <Text style={styles.inputLabel}>Property Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    propertyType === type.value && styles.typeChipActive,
                  ]}
                  onPress={() => setPropertyType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      propertyType === type.value && styles.typeChipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label="Price (PKR)"
              placeholder="e.g. 5000000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              leftIcon="cash-outline"
            />
          </Card>

          {/* Property Details */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Bedrooms"
                  placeholder="0"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                  leftIcon="bed-outline"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Bathrooms"
                  placeholder="0"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                  leftIcon="water-outline"
                />
              </View>
            </View>

            <Input
              label="Area (sqft)"
              placeholder="e.g. 1200"
              value={area}
              onChangeText={setArea}
              keyboardType="numeric"
              leftIcon="resize-outline"
            />

            <Input
              label="Amenities"
              placeholder="Pool, Gym, Parking (comma-separated)"
              value={amenities}
              onChangeText={setAmenities}
              leftIcon="list-outline"
            />
          </Card>

          {/* Address */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <Input
              label="Street"
              placeholder="e.g. 123 Main St"
              value={street}
              onChangeText={setStreet}
              leftIcon="location-outline"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="City"
                  placeholder="Lahore"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="State"
                  placeholder="Punjab"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Country"
                  placeholder="Pakistan"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Zip Code"
                  placeholder="54000"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Latitude"
                  placeholder="31.5204"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Longitude"
                  placeholder="74.3587"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Installment Plan */}
          <Card variant="outlined" style={styles.section}>
            <View style={styles.installmentHeader}>
              <Text style={styles.sectionTitle}>Installment Plan</Text>
              <Switch
                value={hasInstallment}
                onValueChange={setHasInstallment}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={hasInstallment ? Colors.primary : Colors.textTertiary}
              />
            </View>

            {hasInstallment && (
              <>
                <Input
                  label="Down Payment (PKR)"
                  placeholder="e.g. 1000000"
                  value={downPayment}
                  onChangeText={setDownPayment}
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                />
                <Input
                  label="Monthly Amount (PKR)"
                  placeholder="e.g. 50000"
                  value={monthlyAmount}
                  onChangeText={setMonthlyAmount}
                  keyboardType="numeric"
                  leftIcon="calendar-outline"
                />
                <Input
                  label="Total Installments"
                  placeholder="e.g. 60"
                  value={totalInstallments}
                  onChangeText={setTotalInstallments}
                  keyboardType="numeric"
                  leftIcon="layers-outline"
                />
              </>
            )}
          </Card>

          {/* Submit Button */}
          <Button
            title={isEditing ? 'Update Listing' : 'Create Listing'}
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.section,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  typeScroll: {
    marginBottom: Spacing.lg,
  },
  typeChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
