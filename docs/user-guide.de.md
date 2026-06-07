[English](user-guide.md) · **Deutsch**

# Benutzerhandbuch

Personal Contract Management ist eine lokale Web-App, die alle deine Verträge — Streaming-Dienste, Versicherungspolicen, Handyverträge, Miete, Nebenkosten — an einem Ort zusammenführt. Sie zeigt dir, was du monatlich ausgibst, warnt dich vor automatischen Verlängerungen und informiert dich, wenn Verträge bereits abgelaufen sind.

## Inhaltsverzeichnis

1. [Orientierung](#1-orientierung)
2. [Dashboard](#2-dashboard)
3. [Vertragsliste](#3-vertragsliste)
4. [Vertrag hinzufügen](#4-vertrag-hinzufügen)
5. [Bearbeiten und Löschen](#5-bearbeiten-und-löschen)
6. [Verträge importieren](#6-verträge-importieren)
7. [Verträge exportieren](#7-verträge-exportieren)
8. [Anonymisierung](#8-anonymisierung)
9. [Sprache](#9-sprache)
10. [Konten & Anmeldung](#10-konten--anmeldung)
11. [Feldreferenz](#11-feldreferenz)

---

## 1. Orientierung

Die App hat zwei Hauptbereiche:

| Seite | URL | Zweck |
|-------|-----|-------|
| Dashboard | `/` | Ausgabenübersicht, Verlängerungen, abgelaufene Verträge |
| Verträge | `/contracts` | Vollständige Liste; Erstellen, Importieren, Exportieren |

Navigiere über die Links oben auf jeder Seite zwischen den Bereichen. Jede Detailseite hat einen Zurück-Link in der oberen linken Ecke.

---

## 2. Dashboard

Das Dashboard öffnet sich beim Start der App und gibt dir eine Momentaufnahme deiner aktuellen Situation.

### Monatliche Ausgaben

Die große Zahl oben ist die Summe aller **aktiven** Verträge, umgerechnet auf einen monatlichen Betrag:

| Abrechnungsintervall | Umrechnung |
|---------------------|-----------|
| Wöchentlich | × 52 ÷ 12 |
| Monatlich | × 1 |
| Vierteljährlich | ÷ 3 |
| Jährlich | ÷ 12 |
| Einmalig (Lifetime) | nicht enthalten |

**Beispiel:** Du hast Netflix für 12,99 €/Monat und ein Jahres-Fitnessstudio-Abo für 240 €/Jahr. Das Dashboard zeigt 12,99 € + (240 € ÷ 12) = **32,99 €/Monat**.

### Aufschlüsselung nach Kategorie

Eine Tabelle darunter gruppiert deine aktiven Verträge nach Kategorie und zeigt die monatlichen Ausgaben je Kategorie, sortiert nach Höhe (absteigend).

### Anstehende Verlängerungen

Alle Verträge, deren Enddatum innerhalb der nächsten 30 Tage liegt, erscheinen hier. Jede Zeile zeigt:

- Vertragsname
- Enddatum
- **Kündigungsfrist** — der letzte Tag, an dem du kündigen kannst, ohne für eine weitere Periode gebunden zu sein (Enddatum minus eingestellte Kündigungsfrist)
- Verbleibende Tage, farblich kodiert:
  - **Rot** — Frist bereits abgelaufen
  - **Gelb** — 7 Tage oder weniger verbleibend
  - **Grau** — mehr als 7 Tage verbleibend

**Beispiel:** Dein Mobilfunkvertrag endet am 30. Juni mit einer Kündigungsfrist von 14 Tagen. Die angezeigte Kündigungsfrist ist der 16. Juni. Ist heute der 18. Juni, wird die Zeile rot.

### Abgelaufene Verträge

Verträge, deren Enddatum in der Vergangenheit liegt, erscheinen in einem gelb hervorgehobenen Bereich. Es wird angezeigt, wie viele Tage jeder Vertrag überfällig ist. Klicke auf eine Zeile, um direkt zur Bearbeitungsseite zu gelangen.

---

## 3. Vertragsliste

Öffne **Verträge** über die Navigation, um alle Verträge in einer Tabelle zu sehen.

### Sortierung

Klicke auf eine Spaltenüberschrift, um nach dieser Spalte zu sortieren. Ein weiterer Klick kehrt die Reihenfolge um. Ein dritter Klick hebt die Sortierung auf. Die aktive Sortierrichtung wird mit einem kleinen Pfeil nach oben oder unten angezeigt.

Verfügbare Sortierspalten: Name, Kategorie, Betrag, Status, Enddatum.

### Werkzeugleiste

Die Schaltflächenleiste über der Tabelle enthält:

| Steuerung | Funktion |
|-----------|---------|
| Anonymisierung ein/aus | Verbirgt echte Namen (siehe [Anonymisierung](#8-anonymisierung)) |
| Export | Lädt alle Verträge als JSON oder Excel herunter |
| Import | Öffnet den Import-Assistenten |
| Vertrag hinzufügen | Öffnet das Erstellungsformular |

---

## 4. Vertrag hinzufügen

Klicke auf **Vertrag hinzufügen** in der Vertragsliste. Fülle das Formular aus und klicke auf **Speichern**.

### Minimales Beispiel — Streaming-Abo

| Feld | Wert |
|------|------|
| Name | Netflix |
| Kategorie | Abonnements |
| Betrag | 12,99 |
| Abrechnungsintervall | Monatlich |

Das ist alles, was du brauchst. Die vier Felder oben sind Pflichtfelder; alles andere ist optional.

### Ausführlicheres Beispiel — Versicherungspolice

| Feld | Wert |
|------|------|
| Name | Hausratversicherung |
| Kategorie | Versicherung |
| Betrag | 180,00 |
| Abrechnungsintervall | Jährlich |
| Status | Aktiv |
| Startdatum | 2024-03-01 |
| Enddatum | 2025-03-01 |
| Kündigungsfrist | 4 Wochen |
| Service-URL | https://meinversicherer.example.com/konto |
| Details | Versicherungsschein-Nr.: INS-4821. Deckung bis 50.000 €. |
| Anonymisieren | aus |

Mit diesen Angaben warnt dich das Dashboard ab dem 1. Februar (28 Tage vor dem 1. März), dass Handlungsbedarf besteht.

### Hinweise zu den Feldern

- **Status** ist standardmäßig Aktiv. Setze ihn auf Inaktiv für Verträge, die du bereits gekündigt hast, aber zur Referenz behalten möchtest.
- **Kündigungsfrist** erfordert sowohl eine Zahl als auch eine Einheit (Tage / Wochen / Monate / Jahre). Lässt du sie leer, gilt das Enddatum selbst als Frist.
- **Service-URL** muss eine gültige URL sein, wenn angegeben. Sie ist in der Tabelle nicht anklickbar, kann aber bequem aus dem Bearbeitungsformular kopiert werden.
- **Details** akzeptiert bis zu 2.000 Zeichen. Ein Zähler erscheint, wenn du dich dem Limit näherst.
- **Anonymisieren** — aktiviere diese Option, um den Namen dieses Vertrags immer zu verbergen, unabhängig vom globalen Schalter.

---

## 5. Bearbeiten und Löschen

### Bearbeiten

Klicke auf den **Bearbeiten**-Link in einer Vertragszeile, um das Bearbeitungsformular zu öffnen. Alle Felder sind vorausgefüllt. Nimm deine Änderungen vor und klicke auf **Änderungen speichern**.

### Löschen

Klicke auf **Löschen** in einer Vertragszeile. Die Schaltfläche wechselt zu **Bestätigen** und **Abbrechen** — klicke auf **Bestätigen**, um den Vertrag dauerhaft zu entfernen, oder auf **Abbrechen**, um den Vorgang abzubrechen.

---

## 6. Verträge importieren

Klicke auf **Import** in der Werkzeugleiste der Vertragsliste. Der Assistent hat fünf Schritte.

### Schritt 1 — Hochladen

Ziehe eine Datei in den Upload-Bereich oder klicke, um zu durchsuchen. Unterstützte Formate:

- **JSON** — ein Array von Objekten, z. B. aus diesem App-Export
- **Excel (.xlsx)** — ein Tabellenblatt mit einer Kopfzeile

Maximale Dateigröße: 5 MB.

### Schritt 2 — Einlesen

Die App liest die Datei und erkennt die Spalten automatisch.

### Schritt 3 — Spalten zuordnen

Jede Spalte aus deiner Datei wird einem Feld in der App zugeordnet. Die App erkennt gängige Synonyme und ordnet sie automatisch zu:

| Wenn deine Spalte heißt… | Wird zugeordnet zu |
|--------------------------|-------------------|
| Service Name, Titel, Bezeichnung | Name |
| Monatliche Kosten, Gebühr, Preis | Betrag |
| Abrechnungsrhythmus, Zahlungszyklus | Abrechnungsintervall |
| Ablauf, Ablaufdatum, Verlängerungsdatum | Enddatum |
| Notizen, Beschreibung, Kommentare | Details |
| Webseite, Link, Homepage | Service-URL |

Pflichtfelder sind mit einem `*` markiert. Ist ein Pflichtfeld nicht zugeordnet, wird die Zeile rot hervorgehoben und muss vor dem Import behoben werden. Optionale Spalten können explizit übersprungen werden.

### Schritt 4 — Importieren

Die App erstellt für jede Zeile einen Vertrag. Zeilen, die die Validierung nicht bestehen (z. B. ungültiger Kategorienwert), werden übersprungen und einzeln gemeldet.

### Schritt 5 — Ergebnis

Eine Zusammenfassung zeigt, wie viele Verträge erstellt wurden und wie viele fehlgeschlagen sind, mit einer zeilenspezifischen Fehlermeldung für Misserfolge. Teilimporte sind möglich — erfolgreich geparste Zeilen werden gespeichert, auch wenn andere fehlschlagen.

### Beispiel-JSON-Datei

```json
[
  {
    "name": "Spotify",
    "category": "SUBSCRIPTIONS",
    "amount": 9.99,
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "endDate": "2025-12-31"
  },
  {
    "name": "Kfz-Versicherung",
    "category": "INSURANCE",
    "amount": 420.00,
    "billingInterval": "YEARLY",
    "startDate": "2025-01-01",
    "endDate": "2026-01-01",
    "cancellationPeriod": { "value": 1, "unit": "MONTHS" }
  }
]
```

Gültige Kategoriewerte: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER`

Gültige Abrechnungsintervalle: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`

---

## 7. Verträge exportieren

Klicke auf **Export** in der Werkzeugleiste der Vertragsliste und wähle ein Format.

| Format | Dateiname | Verwendungszweck |
|--------|-----------|-----------------|
| JSON | `contracts-JJJJ-MM-TT.json` | Backup, Reimport, Skripting |
| Excel | `contracts-JJJJ-MM-TT.xlsx` | Tabellenbearbeitung, Weitergabe |

Der Export enthält alle Verträge einschließlich inaktiver. Alle Felder sind enthalten. Der JSON-Export kann direkt wieder in den Import-Assistenten eingelesen werden, ohne Spaltenzuordnung vornehmen zu müssen.

---

## 8. Anonymisierung

Die Anonymisierungsfunktion ersetzt echte Vertragsnamen durch fiktive Firmennamen, sodass du deinen Bildschirm teilen oder Screenshots machen kannst, ohne preiszugeben, welche Dienste du nutzt.

### Globaler Schalter

Klicke auf **Anonymisierung** in der Werkzeugleiste der Vertragsliste. Die Schaltfläche wechselt zwischen:

- **Namen verbergen** — Anonymisierung ist aktiv; echte Namen werden überall ausgeblendet
- **Namen anzeigen** — Anonymisierung ist deaktiviert; echte Namen werden angezeigt

Die Einstellung wird in deinem Browser gespeichert und bleibt über Seitenneuladen hinweg erhalten.

### Einzelvertrag-Flag

Aktiviere das Kontrollkästchen **Anonymisieren** beim Erstellen oder Bearbeiten eines Vertrags, um diesen bestimmten Vertrag immer zu verbergen, auch wenn der globale Schalter deaktiviert ist. Nützlich für besonders sensible Verträge.

### Funktionsweise der Ersetzung

Jeder Vertrag wird anhand seiner internen ID konsistent auf denselben fiktiven Namen abgebildet (z. B. „Aether Dynamics", „Ironveil Corp", „Starfall Industries"). Derselbe Vertrag erhält immer denselben Alias — die Zuordnung ändert sich nie zwischen Sitzungen.

Beträge, Daten, Kategorien und Statuswerte sind unabhängig von der Anonymisierungseinstellung immer sichtbar.

---

## 9. Sprache

Die App unterstützt **Englisch** und **Deutsch**. Verwende die Schaltflächen `EN` / `DE` in der oberen rechten Ecke jeder Seite zum Wechseln. Die Einstellung wird in deinem Browser gespeichert.

Währungsbeträge und Datumsangaben werden entsprechend dem gewählten Gebietsschema formatiert (z. B. `€15,99` und `01.03.2025` auf Deutsch).

---

## 10. Konten & Anmeldung

Die App verlangt jetzt von jedem Besucher eine Anmeldung — jedes Familienmitglied erhält ein eigenes Konto, und Verträge gehören dem Konto, das sie angelegt hat. Niemand kann die Verträge eines anderen Kontos sehen oder ändern — auch nicht im Dashboard, bei Exporten oder Importen.

### An- und Abmelden

Wenn du die App öffnest und keine aktive Sitzung hast, landest du auf der Anmeldeseite. Gib deine E-Mail-Adresse und dein Passwort ein, um fortzufahren. Über die Schaltfläche **Abmelden** in der oberen rechten Ecke beendest du deine Sitzung auf diesem Gerät.

Wenn du zu oft hintereinander das falsche Passwort eingibst, wird das Konto vorübergehend gesperrt — warte ein paar Minuten und versuche es dann erneut mit dem richtigen Passwort.

### Das erste Konto

Beim allerersten Start der App auf einer frischen Installation wird automatisch ein **Administratorkonto** angelegt; dessen E-Mail-Adresse und ein Einmalpasswort werden im Server-Log ausgegeben (sichtbar mit `docker compose logs` oder im Terminal, in dem das Backend läuft). Melde dich mit diesen Zugangsdaten an und **ändere das Passwort sofort** über „Mein Konto" (siehe unten).

Falls du von einer älteren Version der App aktualisierst, wird genau dieses Administratorkonto angelegt und **alle deine bestehenden Verträge werden automatisch diesem Konto zugewiesen** — nichts geht verloren. Anschließend kannst du eigene Konten für die übrigen Familienmitglieder anlegen und bei Bedarf Verträge neu anlegen oder zuordnen.

### Mein Konto

Jeder angemeldete Benutzer kann über **Mein Konto** (Link in der oberen rechten Ecke) sein eigenes Passwort ändern. Du benötigst dazu dein aktuelles Passwort sowie ein neues (mindestens 8 Zeichen).

### Konten verwalten (nur Administratoren)

Administratoren sehen zusätzlich den Link **Konten verwalten** in der oberen rechten Ecke. Dort kannst du:

- Ein neues Konto **anlegen** — mit E-Mail-Adresse, Anzeigename, Rolle (Administrator oder Mitglied) und einem Anfangspasswort, das die Person nach der ersten Anmeldung ändern sollte
- Ein Konto **archivieren**, um jemandem den Zugriff zu entziehen (z. B. wenn ein Familienmitglied auszieht). Archivierte Konten können sich nicht mehr anmelden, ihre Daten bleiben jedoch für eine Aufbewahrungsfrist erhalten, falls du es dir anders überlegst
- Ein archiviertes Konto innerhalb dieser Frist **reaktivieren**, um den Zugriff samt aller zugehörigen Verträge wiederherzustellen
- Ein Konto zwischen den Rollen Administrator und Mitglied **befördern/zurückstufen**

Die App stellt stets sicher, dass mindestens ein aktiver Administrator bestehen bleibt — du kannst den letzten verbleibenden Administrator weder archivieren noch zurückstufen, damit sich der Haushalt nie selbst aus der Kontoverwaltung aussperrt.

---

## 11. Feldreferenz

| Feld | Pflicht | Einschränkungen | Hinweise |
|------|---------|-----------------|---------|
| Name | Ja | 1–200 Zeichen | Wird mit Anbieter-Logo angezeigt |
| Kategorie | Ja | Nebenkosten, Abonnements, Versicherung, Wohnen, Sonstiges | Verwendet in der Dashboard-Aufschlüsselung |
| Betrag | Ja | Zahl ≥ 0 | In deiner lokalen Währung |
| Abrechnungsintervall | Ja | Wöchentlich / Monatlich / Vierteljährlich / Jährlich / Einmalig | Bestimmt das monatliche Äquivalent |
| Status | Ja | Aktiv / Inaktiv | Standard: Aktiv |
| Startdatum | Nein | JJJJ-MM-TT | Zur eigenen Referenz |
| Enddatum | Nein | JJJJ-MM-TT | Steuert Verlängerungs- und Ablaufbenachrichtigungen |
| Kündigungsfrist | Nein | Positive ganze Zahl + Tage/Wochen/Monate/Jahre | Verschiebt die im Dashboard angezeigte Frist |
| Service-URL | Nein | Gültige URL | Link zu deiner Kontoseite |
| Details | Nein | Bis zu 2.000 Zeichen | Versicherungsscheinnummern, Kundennummern, Notizen |
| Anonymisieren | Nein | Ja/Nein | Datenschutz-Flag pro Vertrag |
