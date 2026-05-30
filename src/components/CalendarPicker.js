import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CalendarPicker({ visible, onClose, onSelect, initialDate }) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();

  // Parse initialDate (expected YYYY-MM-DD)
  const today = new Date();
  const parsedInitialDate = useMemo(() => {
    if (!initialDate) return today;
    const parts = initialDate.split('-');
    if (parts.length !== 3) return today;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }, [initialDate]);

  const [currentMonth, setCurrentMonth] = useState(parsedInitialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedInitialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate || today.toISOString().split('T')[0]);

  const getMonthYearTitle = () => {
    const d = new Date(currentYear, currentMonth);
    const targetLocale = locale === 'km' ? 'km-KH' : 'en-US';
    try {
      return d.toLocaleDateString(targetLocale, { month: 'long', year: 'numeric' });
    } catch (e) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[currentMonth]} ${currentYear}`;
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];
    // Blank cells for alignment
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [currentYear, currentMonth]);

  const WEEKDAYS = locale === 'km'
    ? ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleCellPress = (day) => {
    if (!day) return;
    const mStr = (currentMonth + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    setSelectedDate(`${currentYear}-${mStr}-${dStr}`);
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('select_date_title')}
          </Text>

          {/* Month Selector */}
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
              {getMonthYearTitle()}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Weekdays Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, idx) => (
              <Text key={idx} style={[styles.weekdayText, { color: colors.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <FlatList
            data={calendarCells}
            keyExtractor={(item, index) => index.toString()}
            numColumns={7}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
              if (item === null) {
                return <View style={styles.dayCell} />;
              }

              const cellDateStr = `${currentYear}-${(currentMonth + 1)
                .toString()
                .padStart(2, '0')}-${item.toString().padStart(2, '0')}`;

              const isSelected = selectedDate === cellDateStr;

              return (
                <TouchableOpacity
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: colors.primary, borderRadius: 12 },
                  ]}
                  onPress={() => handleCellPress(item)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{t('calendar_confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: width - 40,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: (width - 80) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayCell: {
    width: (width - 80) / 7,
    height: (width - 80) / 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
