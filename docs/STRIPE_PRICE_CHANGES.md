# Stripe Preisänderungen - Rechtliche Anforderungen

## Übersicht

Dieses Dokument beschreibt die rechtlichen und technischen Aspekte bei Preisänderungen für Produkte in Greenlight Fitness.

---

## Technischer Status

### Was passiert bei Produktänderungen in der Admin-Oberfläche?

| Aktion | Datenbank (Supabase) | Stripe |
|--------|---------------------|--------|
| **Neues Produkt erstellen** | ✅ Wird gespeichert | ✅ Wird erstellt (Product + Price) |
| **Produkt bearbeiten** | ✅ Wird aktualisiert | ❌ **Wird NICHT automatisch aktualisiert** |
| **Preis ändern** | ✅ Neuer Preis in DB | ❌ **Stripe behält alten Preis** |
| **Produkt löschen** | ✅ Wird gelöscht | ❌ Stripe-Produkt bleibt bestehen |

### Wichtig zu verstehen:

- **Bestehende Stripe-Abonnements** laufen mit dem ursprünglichen Preis weiter
- Preisänderungen in der App gelten **nur für neue Käufe**
- Um Preise für bestehende Kunden zu ändern, muss dies **manuell im Stripe Dashboard** erfolgen

---

## Rechtliche Anforderungen (DSGVO/AGB)

### 1. Bei Preiserhöhungen für Abonnements

**Pflicht zur Information der Kunden:**
- Kunden müssen **mindestens 30 Tage vorher** über Preisänderungen informiert werden
- Die Mitteilung muss **per E-Mail** erfolgen
- Kunden müssen die Möglichkeit haben, das Abo **vor der Preisänderung zu kündigen**

**Empfohlener Prozess:**
1. E-Mail an alle betroffenen Kunden senden (Resend API)
2. Auf Sonderkündigungsrecht hinweisen
3. Datum der Preisänderung klar kommunizieren
4. Erst nach Ablauf der Frist: Preis im Stripe Dashboard ändern

### 2. Bei Preissenkungen

- Keine besondere Informationspflicht
- Kann sofort umgesetzt werden
- Bestehende Kunden können optional per E-Mail informiert werden

### 3. Bei einmaligen Käufen (One-Time)

- Preisänderungen gelten sofort für neue Käufe
- Bereits abgeschlossene Käufe bleiben unberührt
- Keine Informationspflicht für bestehende Kunden

---

## Stripe Dashboard Aktionen

### Preis für bestehende Abonnenten ändern:

1. Öffne [Stripe Dashboard](https://dashboard.stripe.com)
2. Gehe zu **Products** → Wähle das Produkt
3. Unter **Pricing** → **Add another price** (neuen Preis erstellen)
4. Gehe zu **Subscriptions**
5. Wähle das Abo des Kunden
6. **Update subscription** → Neuen Preis auswählen
7. Wähle ob Änderung sofort oder zum nächsten Zahlungstermin gilt

### Kundenmitteilung erstellen:

Stripe kann automatische E-Mails bei Preisänderungen senden:
1. **Settings** → **Customer emails**
2. Aktiviere "Price change notifications"

---

## Checkliste bei Preisänderungen

- [ ] Entscheidung: Gilt Änderung nur für neue Kunden oder auch für Bestandskunden?
- [ ] Bei Bestandskunden: 30-Tage-Vorlauf einplanen
- [ ] E-Mail-Template vorbereiten
- [ ] Kunden per E-Mail informieren (mit Kündigungsmöglichkeit)
- [ ] Nach Ablauf der Frist: Stripe-Preise manuell aktualisieren
- [ ] Produkt in Admin-Oberfläche aktualisieren

---

## Template für Preisänderungs-E-Mail

```
Betreff: Wichtige Information zu deinem {Produktname}-Abonnement

Hallo {Vorname},

wir möchten dich darüber informieren, dass sich der Preis für dein 
"{Produktname}"-Abonnement zum {Datum} von {Alter Preis} auf {Neuer Preis} ändert.

Du hast bis zum {Datum - 1 Tag} die Möglichkeit, dein Abonnement zu kündigen, 
wenn du mit der Preisänderung nicht einverstanden bist.

Zur Kündigung: {Link zum Kundenportal}

Bei Fragen stehen wir dir gerne zur Verfügung.

Sportliche Grüße,
Dein Greenlight Fitness Team
```

---

## Technische Erweiterungsmöglichkeiten (Future)

1. **Automatische Stripe-Synchronisation**: Bei Produktänderungen auch Stripe aktualisieren
2. **E-Mail-Integration**: Automatische Kundenmitteilung bei Preisänderungen
3. **Preis-Versionierung**: Mehrere Preise pro Produkt mit Gültigkeitszeitraum
4. **Grandfathering**: Alte Preise für Bestandskunden automatisch beibehalten

---

*Letzte Aktualisierung: Februar 2026*
