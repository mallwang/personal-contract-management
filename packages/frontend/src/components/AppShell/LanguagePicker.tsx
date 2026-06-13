import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, UnstyledButton, Group, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import classes from './LanguagePicker.module.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.language as LangCode;
  const [opened, setOpened] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  function handleSelect(code: LangCode) {
    void i18n.changeLanguage(code);
    localStorage.setItem('pcm-lang', code);
    setOpened(false);
  }

  return (
    <Menu opened={opened} onChange={setOpened} withinPortal={false}>
      <Menu.Target>
        <UnstyledButton className={classes.control}>
          <Group gap={6}>
            <Text size="sm">{currentLang.label}</Text>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {LANGUAGES.map(({ code, label }) => (
          <Menu.Item key={code} onClick={() => handleSelect(code)}>
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
